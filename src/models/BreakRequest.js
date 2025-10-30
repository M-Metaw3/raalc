const { EntitySchema } = require('typeorm');

/**
 * BreakRequest Model
 * 
 * Tracks agent break requests and approvals
 */
module.exports = new EntitySchema({
  name: 'BreakRequest',
  tableName: 'break_requests',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    sessionId: {
      type: 'int',
      nullable: false,
      unsigned: true,
      comment: 'Related agent session'
    },
    agentId: {
      type: 'int',
      nullable: false,
      unsigned: true
    },
    policyId: {
      type: 'int',
      nullable: false,
      unsigned: true,
      comment: 'Break policy applied'
    },
    type: {
      type: 'enum',
      enum: ['short', 'lunch', 'emergency'],
      default: 'short'
    },
    requestedDuration: {
      type: 'int',
      nullable: false,
      comment: 'Requested break duration in minutes'
    },
    actualDuration: {
      type: 'int',
      nullable: true,
      comment: 'Actual break duration in minutes'
    },
    startTime: {
      type: 'datetime',
      nullable: true,
      comment: 'Break start timestamp'
    },
    endTime: {
      type: 'datetime',
      nullable: true,
      comment: 'Break end timestamp'
    },
    status: {
      type: 'enum',
      enum: ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled'],
      default: 'pending'
    },
    autoApproved: {
      type: 'boolean',
      default: false,
      comment: 'Was this break auto-approved?'
    },
    reason: {
      type: 'text',
      nullable: true,
      comment: 'Reason for break request'
    },
    rejectionReason: {
      type: 'text',
      nullable: true,
      comment: 'Reason for rejection if rejected'
    },
    reviewedBy: {
      type: 'int',
      nullable: true,
      unsigned: true,
      comment: 'Admin/Supervisor who reviewed'
    },
    reviewedAt: {
      type: 'datetime',
      nullable: true
    },
    violatedRules: {
      type: 'simple-json',
      nullable: true,
      comment: 'List of rules violated: max_breaks, cooldown, etc.'
    },
    createdAt: {
      type: 'datetime',
      createDate: true
    },
    updatedAt: {
      type: 'datetime',
      updateDate: true
    }
  },
  relations: {
    session: {
      type: 'many-to-one',
      target: 'AgentSession',
      joinColumn: {
        name: 'sessionId'
      }
    },
    agent: {
      type: 'many-to-one',
      target: 'Agent',
      joinColumn: {
        name: 'agentId'
      }
    },
    policy: {
      type: 'many-to-one',
      target: 'BreakPolicy',
      joinColumn: {
        name: 'policyId'
      }
    },
    reviewer: {
      type: 'many-to-one',
      target: 'Admin',
      joinColumn: {
        name: 'reviewedBy'
      },
      nullable: true
    }
  },
  indices: [
    {
      name: 'IDX_BREAK_AGENT_STATUS',
      columns: ['agentId', 'status']
    },
    {
      name: 'IDX_BREAK_SESSION',
      columns: ['sessionId', 'status']
    }
  ]
});

