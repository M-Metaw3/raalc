const { EntitySchema } = require('typeorm');

/**
 * ApplicationType Entity
 * 
 * Represents different types of applications/services that can be offered
 * Examples: Registration, Smart Application, Legal Services, etc.
 * Each type can have multiple SmartApplications under it
 */
module.exports = new EntitySchema({
  name: 'ApplicationType',
  tableName: 'application_types',
  
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    // Basic Info
    name: {
      type: 'varchar',
      length: 100,
      nullable: false,
      unique: true,
      comment: 'Type name in English (e.g., Registration, Smart Application)'
    },
    
    nameAr: {
      type: 'varchar',
      length: 100,
      nullable: false,
      comment: 'Type name in Arabic'
    },
    
    description: {
      type: 'text',
      nullable: true,
      comment: 'Description in English'
    },
    
    descriptionAr: {
      type: 'text',
      nullable: true,
      comment: 'Description in Arabic'
    },
    
    // Display
    icon: {
      type: 'varchar',
      length: 255,
      nullable: true,
      comment: 'Icon URL or icon name for display'
    },
    
    color: {
      type: 'varchar',
      length: 50,
      nullable: true,
      comment: 'Color code for UI (e.g., #FF5733)'
    },
    
    order: {
      type: 'int',
      unsigned: true,
      default: 0,
      nullable: false,
      comment: 'Display order (lower numbers appear first)'
    },
    
    // Status
    isActive: {
      type: 'boolean',
      default: true,
      nullable: false,
      comment: 'Whether this type is active and visible'
    },
    
    // Soft Delete
    deletedAt: {
      type: 'datetime',
      nullable: true,
      comment: 'Soft delete timestamp'
    },
    
    // Audit
    createdBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin ID who created this type'
    },
    
    updatedBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin ID who last updated this type'
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
    additionalServices: {
      type: 'one-to-many',
      target: 'AdditionalService',
      inverseSide: 'applicationType'
    }
  },
  
  indices: [
    {
      name: 'idx_application_types_name',
      columns: ['name'],
      unique: true
    },
    {
      name: 'idx_application_types_is_active',
      columns: ['isActive']
    },
    {
      name: 'idx_application_types_deleted_at',
      columns: ['deletedAt']
    },
    {
      name: 'idx_application_types_order',
      columns: ['order']
    }
  ]
});

