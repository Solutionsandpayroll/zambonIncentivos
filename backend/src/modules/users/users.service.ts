import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../shared/database/prisma.service';
import { AppRole } from '../../common/constants/roles';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto, ResetPasswordDto } from './dto/password.dto';

const BCRYPT_ROUNDS = 10;

/** Proyección segura: nunca devuelve passwordHash. */
const USER_SELECT = {
  userId: true,
  username: true,
  employeeId: true,
  userStatus: true,
  lastLoginAt: true,
  createdAt: true,
  employee: {
    select: {
      employeeCode: true,
      person: { select: { documentNumber: true, firstName: true, lastName: true } },
    },
  },
  roles: { select: { role: { select: { roleName: true } } } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: { roleName?: string; status?: string }) {
    const users = await this.prisma.appUser.findMany({
      where: {
        ...(filters.status ? { userStatus: filters.status as never } : {}),
        ...(filters.roleName
          ? { roles: { some: { role: { roleName: filters.roleName } } } }
          : {}),
      },
      select: USER_SELECT,
      orderBy: { username: 'asc' },
    });
    return users.map(this.flattenRoles);
  }

  async findOne(userId: string) {
    const user = await this.prisma.appUser.findUnique({
      where: { userId },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('El usuario no existe');
    return this.flattenRoles(user);
  }

  /**
   * Crea el usuario, lo vincula a un empleado y le asigna roles.
   * La contraseña se almacena siempre hasheada (bcrypt).
   */
  async create(dto: CreateUserDto) {
    const existing = await this.prisma.appUser.findUnique({
      where: { username: dto.username },
      select: { userId: true },
    });
    if (existing) {
      throw new ConflictException('El nombre de usuario ya existe');
    }

    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { employeeId: dto.employeeId },
        select: { employeeId: true, appUser: { select: { userId: true } } },
      });
      if (!employee) throw new NotFoundException('El empleado no existe');
      if (employee.appUser) {
        throw new ConflictException('El empleado ya tiene un usuario asignado');
      }
    }

    const roleIds = await this.resolveRoleIds(dto.roleNames);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const created = await this.prisma.appUser.create({
      data: {
        username: dto.username,
        passwordHash,
        employeeId: dto.employeeId ?? null,
        // La contraseña inicial la fija quien crea la cuenta, no su dueño.
        mustChangePassword: true,
        roles: { create: roleIds.map((roleId) => ({ roleId })) },
      },
      select: USER_SELECT,
    });
    return this.flattenRoles(created);
  }

  /** Cambia estado y/o reemplaza el conjunto de roles. */
  async update(userId: string, dto: UpdateUserDto) {
    await this.assertExists(userId);

    if (dto.roleNames) {
      const roleIds = await this.resolveRoleIds(dto.roleNames);
      await this.prisma.$transaction([
        this.prisma.userRole.deleteMany({ where: { userId } }),
        this.prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId, roleId })),
        }),
      ]);
    }

    const updated = await this.prisma.appUser.update({
      where: { userId },
      data: { ...(dto.userStatus ? { userStatus: dto.userStatus } : {}) },
      select: USER_SELECT,
    });
    return this.flattenRoles(updated);
  }

  /** ADMIN restablece la contraseña de otro usuario. */
  async resetPassword(userId: string, dto: ResetPasswordDto) {
    await this.assertExists(userId);
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.appUser.update({
      where: { userId },
      data: {
        passwordHash,
        // La contraseña la fijó un tercero: el usuario debe cambiarla al entrar.
        mustChangePassword: true,
      },
    });
  }

  /** El usuario cambia su propia contraseña, verificando la actual. */
  async changeOwnPassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.appUser.findUnique({
      where: { userId },
      select: { passwordHash: true },
    });
    if (!user) throw new NotFoundException('El usuario no existe');

    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('La contraseña actual no coincide');

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser distinta de la actual',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.appUser.update({
      where: { userId },
      data: {
        passwordHash,
        // La eligió el propio usuario: se levanta la exigencia de cambiarla.
        mustChangePassword: false,
      },
    });
  }

  private async assertExists(userId: string): Promise<void> {
    const user = await this.prisma.appUser.findUnique({
      where: { userId },
      select: { userId: true },
    });
    if (!user) throw new NotFoundException('El usuario no existe');
  }

  /** Traduce nombres de rol a IDs, exigiendo que todos existan. */
  private async resolveRoleIds(roleNames: AppRole[]): Promise<string[]> {
    const roles = await this.prisma.role.findMany({
      where: { roleName: { in: roleNames } },
      select: { roleId: true, roleName: true },
    });
    if (roles.length !== roleNames.length) {
      const found = roles.map((r) => r.roleName);
      const missing = roleNames.filter((r) => !found.includes(r));
      throw new BadRequestException(
        `Roles inexistentes: ${missing.join(', ')}. ¿Ejecutaste el seed de roles?`,
      );
    }
    return roles.map((r) => r.roleId);
  }

  /** Aplana roles anidados a un arreglo de nombres. */
  private flattenRoles(user: any) {
    const { roles, ...rest } = user;
    return { ...rest, roles: roles.map((r: any) => r.role.roleName) };
  }
}
