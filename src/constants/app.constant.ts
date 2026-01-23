import { UserPlan } from './database.constant';

export const SESSION_MAX_AGE = 1000 * 60 * 60 * 24; // 48 hours
export const USER_INVITE_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Change log:
 * - v1: Initial version
 */
export const CURRENT_VERSION_API = '1';

export const VERSIONING_API = {
  v1: '1',
  v2: '2',
};

export const DEFAULT_ID = -1;

export const SEPARATOR_POLICY = '::';

export const HEADER_TEAM_ID = 'x-team-id';

export const USER_EMAIL = {
  NO_REPLY: 'no-reply',
  SUPPORT: 'support',
  SYSTEM: 'system',
  ADMIN: 'admin',
};

export const PLAN_RESOURCE: Record<UserPlan, number> = {
  [UserPlan.FREE]: 6,
  [UserPlan.PREMIUM]: 12,
  [UserPlan.UNLIMITED]: 999,
};
