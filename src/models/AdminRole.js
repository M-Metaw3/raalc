const { EntitySchema } = require('typeorm');

/**
 * Admin-Role Junction Table
 * 
 * Many-to-Many relationship between Admins and Roles
 * Allows admins to have multiple roles
 */
module.exports = new EntitySchema({
  name: 'AdminRole',
  tableName: 'admin_roles',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    adminId: {
      type: 'int',
      unsigned: true,
      nullable: false
    },
    
    roleId: {
      type: 'int',
      unsigned: true,
      nullable: false
    },
    
    // Audit fields
    assignedBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin ID who assigned this role'
    },
    
    assignedAt: {
      type: 'datetime',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
      comment: 'When this role was assigned'
    },
    
    // Timestamps
    createdAt: {
      type: 'datetime',
      createDate: true,
      nullable: false
    }
  },
  
  relations: {
    admin: {
      type: 'many-to-one',
      target: 'Admin',
      joinColumn: {
        name: 'adminId'
      },
      onDelete: 'CASCADE'
    },
    role: {
      type: 'many-to-one',
      target: 'Role',
      joinColumn: {
        name: 'roleId'
      },
      onDelete: 'CASCADE'
    }
  },
  
  indices: [
    {
      name: 'idx_admin_roles_admin_id',
      columns: ['adminId']
    },
    {
      name: 'idx_admin_roles_role_id',
      columns: ['roleId']
    },
    {
      name: 'idx_admin_roles_unique',
      columns: ['adminId', 'roleId'],
      unique: true
    }
  ]
});

