// src/common/constants.ts

export const VALID_ROLES = ['client', 'support', 'admin'] as const;
export type Role = (typeof VALID_ROLES)[number];