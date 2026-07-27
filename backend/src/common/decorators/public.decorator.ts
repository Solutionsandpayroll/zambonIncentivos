import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca un endpoint como público (sin JWT): login y refresh. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
