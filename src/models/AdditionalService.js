const { EntitySchema } = require('typeorm');

/**
 * AdditionalService Entity
 * 
 * Represents services under each ApplicationType
 * Each service has its own price and details
 * Examples: 
 *   - Under "Smart Application": Legal Consultation (500 SAR)
 *   - Under "Registration": Company Registration (5000 SAR)
 */
module.exports = new EntitySchema({
  name: 'AdditionalService',
  tableName: 'additional_services',
  
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    // Foreign Key
    applicationTypeId: {
      type: 'int',
      unsigned: true,
      nullable: false,
      comment: 'ApplicationType this service belongs to'
    },
    
    // Basic Info
    name: {
      type: 'varchar',
      length: 200,
      nullable: false,
      comment: 'Service name in English'
    },
    
    nameAr: {
      type: 'varchar',
      length: 200,
      nullable: false,
      comment: 'Service name in Arabic'
    },
    
    description: {
      type: 'text',
      nullable: true,
      comment: 'Service description in English'
    },
    
    descriptionAr: {
      type: 'text',
      nullable: true,
      comment: 'Service description in Arabic'
    },
    
    // Pricing
    price: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      unsigned: true,
      nullable: false,
      comment: 'Service price in SAR'
    },
    
    // Duration
    duration: {
      type: 'varchar',
      length: 100,
      nullable: true,
      comment: 'Estimated duration (e.g., "1-2 hours", "3-5 days")'
    },
    
    durationAr: {
      type: 'varchar',
      length: 100,
      nullable: true,
      comment: 'Estimated duration in Arabic'
    },
    
    // Display
    icon: {
      type: 'varchar',
      length: 255,
      nullable: true,
      comment: 'Service icon URL or name'
    },
    
    image: {
      type: 'varchar',
      length: 500,
      nullable: true,
      comment: 'Service image URL'
    },
    
    order: {
      type: 'int',
      unsigned: true,
      default: 0,
      nullable: false,
      comment: 'Display order within the ApplicationType'
    },
    
    // Features
    isRequired: {
      type: 'boolean',
      default: false,
      nullable: false,
      comment: 'Whether this service is mandatory'
    },
    
    isFeatured: {
      type: 'boolean',
      default: false,
      nullable: false,
      comment: 'Whether this service is featured/highlighted'
    },
    
    // Status
    isActive: {
      type: 'boolean',
      default: true,
      nullable: false,
      comment: 'Whether this service is active and available'
    },
    
    // Additional Info (JSON)
    requiredDocuments: {
      type: 'text',
      nullable: true,
      comment: 'JSON array of required documents'
    },
    
    steps: {
      type: 'text',
      nullable: true,
      comment: 'JSON array of service steps/process'
    },
    
    features: {
      type: 'text',
      nullable: true,
      comment: 'JSON array of service features/benefits'
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
      comment: 'Admin ID who created this service'
    },
    
    updatedBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin ID who last updated this service'
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
    applicationType: {
      type: 'many-to-one',
      target: 'ApplicationType',
      joinColumn: {
        name: 'applicationTypeId'
      },
      onDelete: 'CASCADE'
    }
  },
  
  indices: [
    {
      name: 'idx_additional_services_application_type_id',
      columns: ['applicationTypeId']
    },
    {
      name: 'idx_additional_services_is_active',
      columns: ['isActive']
    },
    {
      name: 'idx_additional_services_deleted_at',
      columns: ['deletedAt']
    },
    {
      name: 'idx_additional_services_order',
      columns: ['order']
    },
    {
      name: 'idx_additional_services_is_featured',
      columns: ['isFeatured']
    },
    {
      name: 'idx_additional_services_price',
      columns: ['price']
    },
    {
      name: 'idx_additional_services_app_type_active',
      columns: ['applicationTypeId', 'isActive']
    }
  ]
});

