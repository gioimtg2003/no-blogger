export const DATABASE_TABLES = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  USER_ROLES: 'user_roles',
  ROLE_PERMISSIONS: 'role_permissions',
  TEAMS: 'teams',
  TEAM_USERS: 'team_users',
  RESOURCES: 'resources',
  RESOURCE_PERMISSIONS: 'resource_permissions',
  CONTENT: 'contents',
  CONTENT_AUDITS: 'content_audits',
  USER_INVITES: 'user_invites',
  USER_JOIN_REQUESTS: 'user_join_requests',
  AUDIT_LOGS: 'audit_logs',
};

export enum UserPlan {
  FREE = 1,
  PREMIUM = 2,
  UNLIMITED = 3,
}

export enum PostStatus {
  DRAFT = 1,
  PUBLISHED = 2,
  ARCHIVED = 3,
}

export enum ResourceType {
  BLOG = 1,
  EVENT = 2,
  DOCUMENT = 3,
  MEDIA = 4,
  LANDING_PAGE = 5,
}

export enum AuditLogAction {
  created = 'created',
  updated = 'updated',
  deleted = 'deleted',
}

/** ***********Permission*********** */
export enum ActionPermission {
  create = 'create',
  read = 'read',
  update = 'update',
  delete = 'delete',
  manage = 'manage',
}

export enum SYSTEM_RESOURCE {
  all = 'all',
  'user-team' = 'user-team',
  role = 'role',
  user = 'user',
  team = 'team',
  content = 'content',
  resource = 'resource',
  policy = 'policy',
  settings = 'settings',
  permission = 'permission',
  audit = 'audit',
  'user-invite' = 'user-invite',
}

export const SYSTEM_RESOURCE_AVAILABLE_FOR_PERMISSION = Object.values(
  SYSTEM_RESOURCE,
)?.filter(
  (res) =>
    ![
      SYSTEM_RESOURCE.team,
      SYSTEM_RESOURCE.user,
      SYSTEM_RESOURCE.audit,
      SYSTEM_RESOURCE.settings,
      SYSTEM_RESOURCE.permission,
      SYSTEM_RESOURCE.policy,
    ].includes(res),
);

export type ResourcePermission =
  | `${SYSTEM_RESOURCE}`
  | `${SYSTEM_RESOURCE}::${number | 'all'}`; // e.g., posts:1; users:2,2,3,4,5

export type Policy = `${ActionPermission}::${ResourcePermission}`; // e.g., create:posts:1, read:users:2
/** ***********End Permission*********** */
