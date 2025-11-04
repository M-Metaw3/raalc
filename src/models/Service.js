const { EntitySchema } = require('typeorm');

/**
 * Service Entity
 * 
 * Represents services offered within departments
 * Each service belongs to one department (Many-to-One relationship)
 * Services can be activated/deactivated independently
 */
module.exports = new EntitySchema({
  name: 'Service',
  tableName: 'services',
  
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    // Service Info
    name: {
      type: 'varchar',
      length: 100,
      nullable: false,
      comment: 'Service name (must be unique within department)'
    },
    
    description: {
      type: 'text',
      nullable: true,
      comment: 'Detailed description of the service'
    },
    
    // Pricing
    price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      unsigned: true,
      nullable: false,
      comment: 'Service price (must be positive)'
    },
  
    
    // Image
    image: {
      type: 'varchar',
      length: 500,
      nullable: true,
      comment: 'Service image URL'
    },
    
    // Foreign Key
    departmentId: {
      type: 'int',
      unsigned: true,
      nullable: false,
      comment: 'Department this service belongs to'
    },
    
    // Status
    isActive: {
      type: 'boolean',
      default: true,
      nullable: false,
      comment: 'Whether the service is currently active'
    },
    
    // Soft Delete
    deletedAt: {
      type: 'datetime',
      nullable: true,
      comment: 'Soft delete timestamp'
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
  
  relations: {
    department: {
      type: 'many-to-one',
      target: 'Department',
      joinColumn: {
        name: 'departmentId'
      },
      onDelete: 'CASCADE'
    }
  },
  
  indices: [
    {
      name: 'idx_services_department_id',
      columns: ['departmentId']
    },
    {
      name: 'idx_services_name_department',
      columns: ['name', 'departmentId'],
      unique: true,
      where: 'deleted_at IS NULL'
    },
    {
      name: 'idx_services_is_active',
      columns: ['isActive']
    },
    {
      name: 'idx_services_deleted_at',
      columns: ['deletedAt']
    },
    {
      name: 'idx_services_price',
      columns: ['price']
    }
  ]
});

