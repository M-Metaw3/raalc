const { EntitySchema } = require('typeorm');

/**
 * Admin Entity
 * 
 * Admins who manage the system with elevated privileges
 * Support multiple roles per admin for flexible RBAC
 * Created only by existing admins (typically the first admin is seeded)
 */
module.exports = new EntitySchema({
  name: 'Admin',
  tableName: 'admins',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    // Basic Information
    firstName: {
      type: 'varchar',
      length: 100,
      nullable: false
    },
    
    lastName: {
      type: 'varchar',
      length: 100,
      nullable: false
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
      comment: 'URL to admin profile image'
    },
    
    // Account status
    isActive: {
      type: 'boolean',
      default: false, // Admins need to be activated
      nullable: false
    },
    
    // Created by which admin
    createdBy: {
      type: 'int',
      unsigned: true,
      nullable: true
    },
    
    // Security
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
      name: 'idx_admins_email',
      columns: ['email']
    },
    {
      name: 'idx_admins_is_active',
      columns: ['isActive']
    },
    {
      name: 'idx_admins_deleted_at',
      columns: ['deletedAt']
    }
  ],
  
  // Many-to-Many relationship with Roles via AdminRole junction table
  relations: {
    creator: {
      type: 'many-to-one',
      target: 'Admin',
      joinColumn: {
        name: 'createdBy',
        referencedColumnName: 'id'
      },
      nullable: true
    },
    adminRoles: {
      type: 'one-to-many',
      target: 'AdminRole',
      inverseSide: 'admin'
    }
  }
});

