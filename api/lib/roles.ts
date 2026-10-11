export const roles = ['admin', 'editor', 'event_manager', 'member'] as const;
export type UserRole = (typeof roles)[number];

export const rolePermissions: Record<UserRole, string[]> = {
  admin: ['manage_users', 'review_applications', 'manage_content', 'manage_events', 'view_audit_logs'],
  editor: ['manage_content', 'review_applications'],
  event_manager: ['manage_events'],
  member: ['view_own_profile', 'register_for_events'],
};

export function canAccess(role: UserRole, permission: string) {
  return rolePermissions[role]?.includes(permission) ?? false;
}
