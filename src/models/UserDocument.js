const { EntitySchema } = require('typeorm');

/**
 * User Document Entity
 * 
 * Stores documents uploaded by users (Emirates ID, Passport, etc.)
 * Each user can have multiple documents
 */
module.exports = new EntitySchema({
  name: 'UserDocument',
  tableName: 'user_documents',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    
    // User relationship
    userId: {
      type: 'int',
      unsigned: true,
      nullable: false,
      comment: 'Foreign key to users table'
    },
    
    // File information
    filename: {
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: 'Stored filename on server'
    },
    
    originalName: {
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: 'Original filename from user'
    },
    
    mimetype: {
      type: 'varchar',
      length: 100,
      nullable: false,
      comment: 'File MIME type'
    },
    
    size: {
      type: 'int',
      unsigned: true,
      nullable: false,
      comment: 'File size in bytes'
    },
    
    url: {
      type: 'varchar',
      length: 500,
      nullable: false,
      comment: 'Full URL to access the document'
    },
    
    path: {
      type: 'varchar',
      length: 500,
      nullable: false,
      comment: 'File path on server'
    },
    
    // Metadata
    uploadedAt: {
      type: 'datetime',
      nullable: false,
      default: () => 'CURRENT_TIMESTAMP',
      comment: 'Upload timestamp'
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
  
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'userId'
      },
      onDelete: 'CASCADE'
    }
  },
  
  indices: [
    {
      name: 'idx_user_documents_user_id',
      columns: ['userId']
    },
    {
      name: 'idx_user_documents_deleted_at',
      columns: ['deletedAt']
    }
  ]
});




