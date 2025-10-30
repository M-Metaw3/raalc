const { EntitySchema } = require('typeorm');

/**
 * Role Entity
 * 
 * Represents different roles in the system (Super Admin, Admin, Moderator, etc.)
 * Supports multiple roles per admin for flexible access control
 */
module.exports = new EntitySchema({
  name: 'Role',
  tableName: 'roles',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    // Role Information
    name: {
      type: 'varchar',
      length: 50,
      nullable: false,
      unique: true,
      comment: 'Unique role name (e.g., Super Admin, Admin)'
    },
    
    slug: {
      type: 'varchar',
      length: 50,
      nullable: false,
      unique: true,
      comment: 'URL-friendly version of role name'
    },
    
    description: {
      type: 'text',
      nullable: true,
      comment: 'Description of role responsibilities'
    },
    
    // Metadata
    isActive: {
      type: 'boolean',
      default: true,
      nullable: false,
      comment: 'Whether this role is active'
    },
    
    // Timestamps
    createdAt: {
      type: 'datetime',
      createDate: true,
      nullable: false
    },
    
    updatedAt: {
      type: 'datetime',
      updateDate: true,
      nullable: false
    }
  },
  
  indices: [
    {
      name: 'idx_roles_slug',
      columns: ['slug']
    },
    {
      name: 'idx_roles_is_active',
      columns: ['isActive']
    }
  ]
});

