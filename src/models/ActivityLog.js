const { EntitySchema } = require('typeorm');

/**
 * ActivityLog Model
 * 
 * Tracks all agent activities (check-in, check-out, breaks, etc.)
 */
module.exports = new EntitySchema({
  name: 'ActivityLog',
  tableName: 'activity_logs',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    agentId: {
      type: 'int',
      nullable: false,
      unsigned: true
    },
    sessionId: {
      type: 'int',
      nullable: true,
      unsigned: true,
      comment: 'Related session if applicable'
    },
    type: {
      type: 'enum',
      enum: [
        'check_in',
        'check_out',
        'break_request',
        'break_start',
        'break_end',
        'break_approved',
        'break_rejected',
        'status_change',
        'shift_change',
        'overtime_request',
        'overtime_approved',
        'system_event'
      ],
      nullable: false
    },
    action: {
      type: 'varchar',
      length: 255,
      nullable: false,
      comment: 'Human-readable action description'
    },
    details: {
      type: 'text',
      nullable: true,
      comment: 'Additional details in JSON or text format'
    },
    metadata: {
      type: 'simple-json',
      nullable: true,
      comment: 'Structured metadata: {breakId, duration, etc.}'
    },
    ipAddress: {
      type: 'varchar',
      length: 45,
      nullable: true
    },
    userAgent: {
      type: 'text',
      nullable: true
    },
    performedBy: {
      type: 'int',
      nullable: true,
      comment: 'Admin/Supervisor who performed the action (if applicable)'
    },
    timestamp: {
      type: 'datetime',
      createDate: true
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
    session: {
      type: 'many-to-one',
      target: 'AgentSession',
      joinColumn: {
        name: 'sessionId'
      },
      nullable: true
    }
  },
  indices: [
    {
      name: 'IDX_ACTIVITY_AGENT',
      columns: ['agentId', 'timestamp']
    },
    {
      name: 'IDX_ACTIVITY_TYPE',
      columns: ['type', 'timestamp']
    },
    {
      name: 'IDX_ACTIVITY_SESSION',
      columns: ['sessionId']
    }
  ]
});

