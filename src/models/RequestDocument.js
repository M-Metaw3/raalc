const { EntitySchema } = require('typeorm');

/**
 * RequestDocument Entity
 * 
 * Represents documents uploaded with service requests
 * Users can upload up to 5 documents per request
 * Supported formats: PDF, Images (JPEG, PNG, GIF, WebP), Word documents (DOC, DOCX)
 * Maximum file size: 5MB per file
 */
module.exports = new EntitySchema({
  name: 'RequestDocument',
  tableName: 'request_documents',

  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },

    requestId: {
      type: 'int',
      unsigned: true,
      nullable: false,
      comment: 'Service request this document belongs to'
    },

    fileName: {
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: 'Original file name'
    },

    filePath: {
      type: 'varchar',
      length: 500,
      nullable: false,
      comment: 'Path to uploaded file'
    },

    fileType: {
      type: 'varchar',
      length: 50,
      nullable: false,
      comment: 'File MIME type'
    },

    fileSize: {
      type: 'int',
      unsigned: true,
      nullable: false,
      comment: 'File size in bytes'
    },

    uploadedBy: {
      type: 'int',
      unsigned: true,
      nullable: false,
      comment: 'User who uploaded this document'
    },

    // Soft Delete
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
    serviceRequest: {
      type: 'many-to-one',
      target: 'ServiceRequest',
      joinColumn: {
        name: 'requestId'
      },
      onDelete: 'CASCADE'
    },

    uploader: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'uploadedBy'
      },
      onDelete: 'CASCADE'
    }
  },

  indices: [
    {
      name: 'idx_request_documents_request_id',
      columns: ['requestId']
    },
    {
      name: 'idx_request_documents_uploaded_by',
      columns: ['uploadedBy']
    },
    {
      name: 'idx_request_documents_deleted_at',
      columns: ['deletedAt']
    }
  ]
});

