const { EntitySchema } = require('typeorm');

/**
 * User Entity
 * 
 * Regular users with basic access to the system
 * Can register themselves without approval
 */
module.exports = new EntitySchema({
  name: 'User',
  tableName: 'users',
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
      comment: 'Full name of the user'
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
      nullable: true
    },
    
    // Profile Image
    avatar: {
      type: 'varchar',
      length: 500,
      nullable: true,
      comment: 'URL to user profile image'
    },
    
    // Account status
    isActive: {
      type: 'boolean',
      default: true, // Users are active by default
      nullable: false
    },
    
    isEmailVerified: {
      type: 'boolean',
      default: false,
      nullable: false,
      comment: 'Email verification status'
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
      comment: 'Whether user has uploaded required documents'
    },
    
    // Security & Verification
    // OTP verification is handled via Redis (temporary tokens)
    
    lastLoginAt: {
      type: 'datetime',
      nullable: true
    },
    
    lastLoginIp: {
      type: 'varchar',
      length: 45,
      nullable: true
    },
    
    lastDeviceId: {
      type: 'varchar',
      length: 255,
      nullable: true,
      comment: 'Last device ID used for login'
    },
    
    fcmToken: {
      type: 'text',
      nullable: true,
      comment: 'Firebase Cloud Messaging token for push notifications'
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
  
  indices: [
    {
      name: 'idx_users_email',
      columns: ['email']
    },
    {
      name: 'idx_users_is_active',
      columns: ['isActive']
    },
    {
      name: 'idx_users_deleted_at',
      columns: ['deletedAt']
    }
  ]
});
