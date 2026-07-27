/**
 * Configuración tipada del backend. Se carga vía @nestjs/config.
 * Las cadenas de BD se heredan del .env (raíz o backend/).
 */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  incentives: {
    rate80: number;
    rate20: number;
  };
}

/** Secretos de desarrollo. Solo se usan fuera de producción. */
const DEV_JWT_SECRET = 'dev-only-access-secret';
const DEV_REFRESH_SECRET = 'dev-only-refresh-secret';

/**
 * Resuelve un secreto de firma JWT.
 *
 * En producción es obligatorio: si falta, el arranque se aborta en vez de
 * degradar en silencio a un valor conocido (el repositorio es público, así que
 * un fallback publicado permitiría a cualquiera falsificar tokens de ADMIN).
 * En desarrollo se permite un valor fijo para no estorbar el trabajo diario.
 */
function resolveSecret(
  envVar: 'JWT_SECRET' | 'REFRESH_TOKEN_SECRET',
  devFallback: string,
  isProduction: boolean,
): string {
  const value = process.env[envVar];

  if (!value || value.trim() === '') {
    if (isProduction) {
      throw new Error(
        `[config] Falta la variable de entorno ${envVar}. Es obligatoria en ` +
          `producción. Genera una con:\n` +
          `  node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"`,
      );
    }
    return devFallback;
  }

  if (isProduction && value.length < 32) {
    throw new Error(
      `[config] ${envVar} es demasiado corta (${value.length} caracteres). ` +
        `Usa al menos 32; lo recomendado son 64 bytes aleatorios.`,
    );
  }

  return value;
}

export default (): AppConfig => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';

  const secret = resolveSecret('JWT_SECRET', DEV_JWT_SECRET, isProduction);
  const refreshSecret = resolveSecret(
    'REFRESH_TOKEN_SECRET',
    DEV_REFRESH_SECRET,
    isProduction,
  );

  // Un mismo valor para ambos anula la separación access/refresh: un token de
  // acceso robado serviría también como refresh de larga vida.
  if (secret === refreshSecret) {
    throw new Error(
      '[config] JWT_SECRET y REFRESH_TOKEN_SECRET deben ser distintos entre sí.',
    );
  }

  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv,
    jwt: {
      secret,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
      refreshSecret,
      refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
    },
    incentives: {
      rate80: parseFloat(process.env.INCENTIVE_80_RATE ?? '0.80'),
      rate20: parseFloat(process.env.INCENTIVE_20_RATE ?? '0.20'),
    },
  };
};
