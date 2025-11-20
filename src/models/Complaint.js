const { EntitySchema } = require('typeorm');

/**
 * Complaint Entity
 * 
 * Represents user complaints submitted to the system
 * Complaints can be resolved by admins with proper permissions
 * departmentId references Department entity
 */
module.exports = new EntitySchema({
  name: 'Complaint',
  tableName: 'complaints',
  
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    // User Information (can be from authenticated user or anonymous)
    firstName: {
      type: 'varchar',
      length: 100,
      nullable: false,
      comment: 'Complainant first name'
    },
    
    lastName: {
      type: 'varchar',
      length: 100,
      nullable: false,
      comment: 'Complainant last name'
    },
    
    email: {
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: 'Complainant email'
    },
    
    phoneNumber: {
      type: 'varchar',
      length: 20,
      nullable: true,
      comment: 'Complainant phone number'
    },
    
    // Complaint Details
    complaintType: {
      type: 'enum',
      enum: ['financial', 'technical', 'service', 'other'],
      nullable: false,
      default: 'other',
      comment: 'Type of complaint'
    },
    
    departmentId: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Department ID related to this complaint'
    },
    
    description: {
      type: 'text',
      nullable: false,
      comment: 'Complaint description/details'
    },
    
    // Attachments (stored as JSON array of file paths)
    attachments: {
      type: 'json',
      nullable: true,
      comment: 'Array of attachment file paths'
    },
    
    // Status
    status: {
      type: 'enum',
      enum: ['pending', 'in_progress', 'resolved', 'rejected', 'closed'],
      default: 'pending',
      nullable: false,
      comment: 'Complaint status'
    },
    
    // Resolution Details
    resolutionNotes: {
      type: 'text',
      nullable: true,
      comment: 'Admin notes about resolution'
    },
    
    resolvedAt: {
      type: 'datetime',
      nullable: true,
      comment: 'When complaint was resolved'
    },
    
    // Relations (Foreign Keys)
    userId: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'User ID if complaint submitted by authenticated user'
    },
    
    resolvedBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin ID who resolved the complaint'
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
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'userId'
      },
      nullable: true,
      onDelete: 'SET NULL'
    },
    
    resolver: {
      type: 'many-to-one',
      target: 'Admin',
      joinColumn: {
        name: 'resolvedBy'
      },
      nullable: true,
      onDelete: 'SET NULL'
    },
    
    department: {
      type: 'many-to-one',
      target: 'Department',
      joinColumn: {
        name: 'departmentId'
      },
      nullable: true,
      onDelete: 'SET NULL'
    }
  },
  
  indices: [
    {
      name: 'idx_complaints_user_id',
      columns: ['userId']
    },
    {
      name: 'idx_complaints_resolved_by',
      columns: ['resolvedBy']
    },
    {
      name: 'idx_complaints_status',
      columns: ['status']
    },
    {
      name: 'idx_complaints_complaint_type',
      columns: ['complaintType']
    },
    {
      name: 'idx_complaints_department_id',
      columns: ['departmentId']
    },
    {
      name: 'idx_complaints_email',
      columns: ['email']
    },
    {
      name: 'idx_complaints_deleted_at',
      columns: ['deletedAt']
    },
    {
      name: 'idx_complaints_status_created',
      columns: ['status', 'createdAt']
    }
  ]
});

