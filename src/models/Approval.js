const { EntitySchema } = require('typeorm');

/**
 * Approval Model
 * 
 * Tracks approvals for break requests, overtime, etc.
 */
module.exports = new EntitySchema({
  name: 'Approval',
  tableName: 'approvals',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    requestType: {
      type: 'enum',
      enum: ['break', 'overtime', 'shift_change', 'early_checkout'],
      nullable: false
    },
    requestId: {
      type: 'int',
      nullable: false,
      comment: 'ID of the related request (break_requests, etc.)'
    },
    agentId: {
      type: 'int',
      nullable: false,
      unsigned: true,
      comment: 'Agent who made the request'
    },
    approverId: {
      type: 'int',
      nullable: false,
      unsigned: true,
      comment: 'Admin/Supervisor who reviewed'
    },
    action: {
      type: 'enum',
      enum: ['approved', 'rejected', 'pending'],
      default: 'pending'
    },
    reason: {
      type: 'text',
      nullable: true,
      comment: 'Reason for approval/rejection'
    },
    notes: {
      type: 'text',
      nullable: true,
      comment: 'Additional notes from approver'
    },
    metadata: {
      type: 'simple-json',
      nullable: true,
      comment: 'Additional metadata about the request'
    },
    createdAt: {
      type: 'datetime',
      createDate: true
    },
    reviewedAt: {
      type: 'datetime',
      nullable: true,
      comment: 'When the approval was reviewed'
    }
  },
  relations: {
    agent: {
      type: 'many-to-one',
      target: 'Agent',
      joinColumn: {
        name: 'agentId'
      }
    },
    approver: {
      type: 'many-to-one',
      target: 'Admin',
      joinColumn: {
        name: 'approverId'
      }
    }
  },
  indices: [
    {
      name: 'IDX_APPROVAL_STATUS',
      columns: ['action', 'createdAt']
    },
    {
      name: 'IDX_APPROVAL_AGENT',
      columns: ['agentId']
    },
    {
      name: 'IDX_APPROVAL_REQUEST',
      columns: ['requestType', 'requestId']
    }
  ]
});

