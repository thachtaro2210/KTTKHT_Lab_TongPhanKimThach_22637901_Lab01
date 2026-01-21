const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest'
};

const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles'
};

// Map roles to permissions
const rolePermissions = {
  [ROLES.ADMIN]: [
    PERMISSIONS.READ,
    PERMISSIONS.WRITE,
    PERMISSIONS.DELETE,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES
  ],
  [ROLES.MODERATOR]: [
    PERMISSIONS.READ,
    PERMISSIONS.WRITE,
    PERMISSIONS.DELETE,
    PERMISSIONS.MANAGE_USERS
  ],
  [ROLES.USER]: [
    PERMISSIONS.READ,
    PERMISSIONS.WRITE
  ],
  [ROLES.GUEST]: [
    PERMISSIONS.READ
  ]
};

// Check if user has a specific permission
function hasPermission(role, permission) {
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
}

// Get all permissions for a role
function getPermissionsForRole(role) {
  return rolePermissions[role] || [];
}

module.exports = {
  ROLES,
  PERMISSIONS,
  hasPermission,
  getPermissionsForRole
};
