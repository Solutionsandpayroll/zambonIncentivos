import { ScopeType } from '../../../common/constants/roles';

/** Vista pública del usuario devuelta tras login / en /auth/me. */
export interface AuthUserView {
  userId: string;
  username: string;
  employeeId: string | null;
  roles: string[];
  scope: { type: ScopeType };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserView;
}
