import { UserPlan } from './database.constant';

export const LIMIT_USER_JOIN_TEAM: Record<UserPlan, number> = {
  [UserPlan.FREE]: 5,
  [UserPlan.PREMIUM]: 20,
  [UserPlan.UNLIMITED]: 100,
};
