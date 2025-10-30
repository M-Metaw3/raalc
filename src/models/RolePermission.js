const { EntitySchema } = require('typeorm');

/**
 * Role-Permission Junction Table
 * 
 * Many-to-Many relationship between Roles and Permissions
 * Defines which permissions each role has
 */
module.exports = new EntitySchema({
  name: 'RolePermission',
  tableName: 'role_permissions',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    roleId: {
      type: 'int',
      unsigned: true,
      nullable: false
    },
    
    permissionId: {
      type: 'int',
      unsigned: true,
      nullable: false
    },
    
    // Audit fields
    grantedBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin ID who granted this permission'
    },
    
    grantedAt: {
      type: 'datetime',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
      comment: 'When this permission was granted'
    },
    
    // Timestamps
    createdAt: {
      type: 'datetime',
      createDate: true,
      nullable: false
    }
  },
  
  relations: {
    role: {
      type: 'many-to-one',
      target: 'Role',
      joinColumn: {
        name: 'roleId'
      },
      onDelete: 'CASCADE'
    },
    permission: {
      type: 'many-to-one',
      target: 'Permission',
      joinColumn: {
        name: 'permissionId'
      },
      onDelete: 'CASCADE'
    }
  },
  
  indices: [
    {
      name: 'idx_role_permissions_role_id',
      columns: ['roleId']
    },
    {
      name: 'idx_role_permissions_permission_id',
      columns: ['permissionId']
    },
    {
      name: 'idx_role_permissions_unique',
      columns: ['roleId', 'permissionId'],
      unique: true
    }
  ]
});

