const { EntitySchema } = require('typeorm');

/**
 * ServiceRequest Entity
 * 
 * Represents service requests submitted by users
 * Users select a category (department) and provide meeting details
 * Agents are assigned to requests (either by user selection or admin assignment)
 * Each request can have multiple documents attached
 * 
 * Business Rules:
 * - User must be authenticated to create a request
 * - User can select a category (required)
 * - User can optionally select an agent from the category
 * - If no agent selected, admin will assign one
 * - Request status flow: pending → approved/rejected → completed/cancelled
 * - Agents can request reassignment to another agent
 */
module.exports = new EntitySchema({
  name: 'ServiceRequest',
  tableName: 'service_requests',

  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },

    // User Information (from logged-in user + additional contact info)
    userId: {
      type: 'int',
      unsigned: true,
      nullable: false,
      comment: 'User who created this request'
    },

    fullName: {
      type: 'varchar',
      length: 100,
      nullable: false,
      comment: 'User full name (auto-filled from user profile)'
    },

    email: {
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: 'Primary email (auto-filled from user profile)'
    },

    phone: {
      type: 'varchar',
      length: 20,
      nullable: false,
      comment: 'Primary phone number (auto-filled from user profile)'
    },

    // Additional contact info specific to this request
    additionalEmail: {
      type: 'varchar',
      length: 255,
      nullable: true,
      comment: 'Additional email for this specific request'
    },

    additionalPhone: {
      type: 'varchar',
      length: 20,
      nullable: true,
      comment: 'Additional phone number for this specific request'
    },

    // Request Details
    categoryId: {
      type: 'int',
      unsigned: true,
      nullable: false,
      comment: 'Selected category/department (e.g., Family)'
    },

    notes: {
      type: 'text',
      nullable: true,
      comment: 'User notes describing what they need (agent uses this to determine specific service)'
    },

    // Meeting Details
    meetingType: {
      type: 'enum',
      enum: ['online', 'offline'],
      nullable: false,
      comment: 'Type of meeting: online or in-person'
    },

    meetingDate: {
      type: 'date',
      nullable: false,
      comment: 'Requested meeting date'
    },

    meetingTime: {
      type: 'time',
      nullable: false,
      comment: 'Requested meeting time'
    },

    meetingDuration: {
      type: 'int',
      unsigned: true,
      nullable: true,
      default: 60,
      comment: 'Meeting duration in minutes (default: 60)'
    },

    // Agent Assignment
    agentId: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Assigned agent (can be selected by user or assigned by admin)'
    },

    isAgentSelectedByUser: {
      type: 'boolean',
      default: false,
      nullable: false,
      comment: 'Whether agent was selected by user (true) or assigned by admin (false)'
    },

    // Service Assignment (determined by agent after reviewing notes)
    serviceId: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Specific service assigned by agent based on user notes'
    },

    // Status Management
    status: {
      type: 'enum',
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      nullable: false,
      comment: 'Request status'
    },

    // Admin/Agent Actions
    approvedBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin/Agent who approved the request'
    },

    approvedAt: {
      type: 'datetime',
      nullable: true,
      comment: 'When the request was approved'
    },

    rejectedBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Admin/Agent who rejected the request'
    },

    rejectedAt: {
      type: 'datetime',
      nullable: true,
      comment: 'When the request was rejected'
    },

    rejectionReason: {
      type: 'text',
      nullable: true,
      comment: 'Reason for rejection'
    },

    completedAt: {
      type: 'datetime',
      nullable: true,
      comment: 'When the service was completed'
    },

    cancelledAt: {
      type: 'datetime',
      nullable: true,
      comment: 'When the request was cancelled'
    },

    cancellationReason: {
      type: 'text',
      nullable: true,
      comment: 'Reason for cancellation'
    },

    // Agent Reassignment
    reassignmentRequestedBy: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Agent who requested reassignment'
    },

    reassignmentRequestedAt: {
      type: 'datetime',
      nullable: true,
      comment: 'When reassignment was requested'
    },

    reassignmentReason: {
      type: 'text',
      nullable: true,
      comment: 'Reason for requesting reassignment'
    },

    previousAgentId: {
      type: 'int',
      unsigned: true,
      nullable: true,
      comment: 'Previous agent before reassignment'
    },

    // Additional Info
    adminNotes: {
      type: 'text',
      nullable: true,
      comment: 'Internal notes from admin/agent'
    },

    priority: {
      type: 'enum',
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      nullable: false,
      comment: 'Request priority level'
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
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'userId'
      },
      onDelete: 'CASCADE'
    },

    category: {
      type: 'many-to-one',
      target: 'Department',
      joinColumn: {
        name: 'categoryId'
      },
      onDelete: 'RESTRICT'
    },

    agent: {
      type: 'many-to-one',
      target: 'Agent',
      joinColumn: {
        name: 'agentId'
      },
      onDelete: 'SET NULL'
    },

    service: {
      type: 'many-to-one',
      target: 'Service',
      joinColumn: {
        name: 'serviceId'
      },
      onDelete: 'SET NULL'
    },

    documents: {
      type: 'one-to-many',
      target: 'RequestDocument',
      inverseSide: 'serviceRequest'
    }
  },

  indices: [
    {
      name: 'idx_service_requests_user_id',
      columns: ['userId']
    },
    {
      name: 'idx_service_requests_category_id',
      columns: ['categoryId']
    },
    {
      name: 'idx_service_requests_agent_id',
      columns: ['agentId']
    },
    {
      name: 'idx_service_requests_service_id',
      columns: ['serviceId']
    },
    {
      name: 'idx_service_requests_status',
      columns: ['status']
    },
    {
      name: 'idx_service_requests_meeting_date',
      columns: ['meetingDate']
    },
    {
      name: 'idx_service_requests_priority',
      columns: ['priority']
    },
    {
      name: 'idx_service_requests_deleted_at',
      columns: ['deletedAt']
    },
    {
      name: 'idx_service_requests_status_agent',
      columns: ['status', 'agentId']
    },
    {
      name: 'idx_service_requests_category_status',
      columns: ['categoryId', 'status']
    }
  ]
});

