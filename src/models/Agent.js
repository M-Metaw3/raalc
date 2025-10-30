const { EntitySchema } = require('typeorm');

/**
 * Agent Entity
 * 
 * Agents with specific functionalities
 * Require admin approval before activation
 */
module.exports = new EntitySchema({
  name: 'Agent',
  tableName: 'agents',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    // Basic Information
    fullName: {
      type: 'varchar',
      length: 200,
      nullable: false,
      comment: 'Agent full name'
    },
    
    email: {
      type: 'varchar',
      length: 255,
      nullable: false,
      unique: true
    },
    
    password: {
      type: 'varchar',
      length: 255,
      nullable: false,
      select: false
    },
    
    phone: {
      type: 'varchar',
      length: 20,
      nullable: false // Required for agents
    },
    
    // Profile Image
    avatar: {
      type: 'varchar',
      length: 500,
      nullable: true,
      comment: 'URL to agent profile image'
    },
    
    // Agent specific fields
    licenseNumber: {
      type: 'varchar',
      length: 100,
      nullable: true,
      comment: 'Agent license or registration number'
    },
    
    agencyName: {
      type: 'varchar',
      length: 255,
      nullable: true,
      comment: 'Name of the agency the agent represents'
    },
    
    // Featured Agent
    featured: {
      type: 'boolean',
      default: false,
      nullable: false,
      comment: 'Featured agent (highlighted by admin)'
    },
    
    // Account status
    isActive: {
      type: 'boolean',
      default: false, // Agents require admin approval
      nullable: false
    },
    
    isEmailVerified: {
      type: 'boolean',
      default: false,
      nullable: false
    },
    
    isPhoneVerified: {
      type: 'boolean',
      default: false,
      nullable: false,
      comment: 'Phone verification status via OTP'
    },
    
    // Document Upload Status
    documentsUploaded: {
      type: 'boolean',
      default: false,
      nullable: false,
      comment: 'Whether agent has uploaded required documents'
    },
    
    // Shift Management Fields
    departmentId: {
      type: 'int',
      nullable: true,
      unsigned: true,
      comment: 'Department/Section (أسرة، عمل، ميراث، etc.)'
    },

    shiftId: {
      type: 'int',
      nullable: true,
      unsigned: true,
      comment: 'Assigned shift'
    },
    
    currentStatus: {
      type: 'enum',
      enum: ['offline', 'active', 'on_break', 'late', 'completed', 'off_shift'],
      default: 'offline',
      comment: 'Current work status'
    },
    
    currentSessionId: {
      type: 'int',
      nullable: true,
      comment: 'Current active session ID if any'
    },
    
    documents: {
      type: 'json',
      nullable: true,
      comment: 'Array of uploaded document URLs and metadata'
    },
    
    // Approval information
    approvedBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin ID who approved this agent'
    },
    
    approvedAt: {
      type: 'datetime',
      nullable: true
    },
    
    rejectedBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin ID who rejected this agent'
    },
    
    rejectedAt: {
      type: 'datetime',
      nullable: true
    },
    
    rejectionReason: {
      type: 'text',
      nullable: true
    },
    
    // Security
    emailVerificationToken: {
      type: 'varchar',
      length: 255,
      nullable: true,
      select: false
    },
    
    emailVerificationExpires: {
      type: 'datetime',
      nullable: true,
      select: false
    },
    
    passwordResetToken: {
      type: 'varchar',
      length: 255,
      nullable: true,
      select: false
    },
    
    passwordResetExpires: {
      type: 'datetime',
      nullable: true,
      select: false
    },
    
    lastLoginAt: {
      type: 'datetime',
      nullable: true
    },
    
    lastLoginIp: {
      type: 'varchar',
      length: 45,
      nullable: true
    },
    
    // Created By (Admin)
    createdBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin ID who created/registered this agent'
    },
    
    // Soft delete
    deletedAt: {
      type: 'datetime',
      nullable: true
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
  
  // Relations
  relations: {
    department: {
      type: 'many-to-one',
      target: 'Department',
      joinColumn: {
        name: 'departmentId'
      },
      nullable: true
    },
    shift: {
      type: 'many-to-one',
      target: 'Shift',
      joinColumn: {
        name: 'shiftId'
      },
      nullable: true
    },
    sessions: {
      type: 'one-to-many',
      target: 'AgentSession',
      inverseSide: 'agent'
    },
    breakRequests: {
      type: 'one-to-many',
      target: 'BreakRequest',
      inverseSide: 'agent'
    },
    activityLogs: {
      type: 'one-to-many',
      target: 'ActivityLog',
      inverseSide: 'agent'
    },
    reports: {
      type: 'one-to-many',
      target: 'Report',
      inverseSide: 'agent'
    },
    creator: {
      type: 'many-to-one',
      target: 'Admin',
      joinColumn: {
        name: 'createdBy'
      },
      nullable: true
    }
  },
  
  indices: [
    {
      name: 'idx_agents_email',
      columns: ['email']
    },
    {
      name: 'idx_agents_is_active',
      columns: ['isActive']
    },
    {
      name: 'idx_agents_deleted_at',
      columns: ['deletedAt']
    },
    {
      name: 'idx_agents_approved_by',
      columns: ['approvedBy']
    },
    {
      name: 'idx_agents_department',
      columns: ['departmentId']
    },
    {
      name: 'idx_agents_shift',
      columns: ['shiftId']
    },
    {
      name: 'idx_agents_status',
      columns: ['currentStatus']
    },
    {
      name: 'idx_agents_featured',
      columns: ['featured']
    },
    {
      name: 'idx_agents_created_by',
      columns: ['createdBy']
    }
  ]
});

