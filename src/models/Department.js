const { EntitySchema } = require('typeorm');

/**
 * Department Model
 * 
 * Represents departments/sections (أسرة، عمل، ميراث، إلخ)
 */
module.exports = new EntitySchema({
  name: 'Department',
  tableName: 'departments',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    name: {
      type: 'varchar',
      length: 100,
      nullable: false,
      unique: true
    },
    nameAr: {
      type: 'varchar',
      length: 100,
      nullable: false,
      comment: 'Arabic name'
    },
    description: {
      type: 'text',
      nullable: true
    },
    isActive: {
      type: 'boolean',
      default: true,
      nullable: false
    },
    
    // Soft Delete
    deletedAt: {
      type: 'datetime',
      nullable: true,
      comment: 'Soft delete timestamp'
    },
    
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
  relations: {
    agents: {
      type: 'one-to-many',
      target: 'Agent',
      inverseSide: 'department'
    },
    shifts: {
      type: 'one-to-many',
      target: 'Shift',
      inverseSide: 'department'
    },
    services: {
      type: 'one-to-many',
      target: 'Service',
      inverseSide: 'department'
    }
  },
  indices: [
    {
      name: 'idx_departments_name',
      columns: ['name'],
      unique: true,
      where: 'deleted_at IS NULL'
    },
    {
      name: 'idx_departments_is_active',
      columns: ['isActive']
    },
    {
      name: 'idx_departments_deleted_at',
      columns: ['deletedAt']
    }
  ]
});

