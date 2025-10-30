const { EntitySchema } = require('typeorm');

/**
 * Permission Entity
 * 
 * Represents granular permissions in the system
 * Uses Resource-Action pattern (e.g., users.create, agents.approve)
 */
module.exports = new EntitySchema({
  name: 'Permission',
  tableName: 'permissions',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    // Permission Information
    name: {
      type: 'varchar',
      length: 100,
      nullable: false,
      unique: true,
      comment: 'Unique permission name (e.g., users.create)'
    },
    
    resource: {
      type: 'varchar',
      length: 50,
      nullable: false,
      comment: 'Resource name (e.g., users, agents, documents)'
    },
    
    action: {
      type: 'varchar',
      length: 50,
      nullable: false,
      comment: 'Action name (e.g., create, read, update, delete)'
    },
    
    description: {
      type: 'text',
      nullable: true,
      comment: 'Description of what this permission allows'
    },
    
    // Grouping
    group: {
      type: 'varchar',
      length: 50,
      nullable: true,
      comment: 'Permission group for UI organization'
    },
    
    // Metadata
    isActive: {
      type: 'boolean',
      default: true,
      nullable: false,
      comment: 'Whether this permission is active'
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
      name: 'idx_permissions_name',
      columns: ['name']
    },
    {
      name: 'idx_permissions_resource',
      columns: ['resource']
    },
    {
      name: 'idx_permissions_action',
      columns: ['action']
    },
    {
      name: 'idx_permissions_group',
      columns: ['group']
    },
    {
      name: 'idx_permissions_is_active',
      columns: ['isActive']
    }
  ]
});

