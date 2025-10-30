const { EntitySchema } = require('typeorm');

/**
 * AgentSession Model
 * 
 * Tracks agent daily work sessions (check-in/check-out)
 */
module.exports = new EntitySchema({
  name: 'AgentSession',
  tableName: 'agent_sessions',
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
    shiftId: {
      type: 'int',
      nullable: false,
      unsigned: true
    },
    date: {
      type: 'date',
      nullable: false,
      comment: 'Session date (YYYY-MM-DD)'
    },
    checkIn: {
      type: 'datetime',
      nullable: false,
      comment: 'Check-in timestamp'
    },
    checkOut: {
      type: 'datetime',
      nullable: true,
      comment: 'Check-out timestamp'
    },
    checkInStatus: {
      type: 'enum',
      enum: ['on_time', 'late', 'early'],
      default: 'on_time'
    },
    lateMinutes: {
      type: 'int',
      default: 0,
      comment: 'Minutes late if check-in was late'
    },
    totalWorkMinutes: {
      type: 'int',
      default: 0,
      comment: 'Total work minutes (excluding breaks)'
    },
    totalBreakMinutes: {
      type: 'int',
      default: 0,
      comment: 'Total break minutes taken'
    },
    overtimeMinutes: {
      type: 'int',
      default: 0,
      comment: 'Overtime minutes worked'
    },
    overtimeApproved: {
      type: 'boolean',
      default: false
    },
    status: {
      type: 'enum',
      enum: ['active', 'on_break', 'completed', 'incomplete'],
      default: 'active'
    },
    checkInIp: {
      type: 'varchar',
      length: 45,
      nullable: true
    },
    checkOutIp: {
      type: 'varchar',
      length: 45,
      nullable: true
    },
    checkInLocation: {
      type: 'simple-json',
      nullable: true,
      comment: 'GPS location if available: {lat, lng}'
    },
    checkOutLocation: {
      type: 'simple-json',
      nullable: true
    },
    notes: {
      type: 'text',
      nullable: true
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
    agent: {
      type: 'many-to-one',
      target: 'Agent',
      joinColumn: {
        name: 'agentId'
      }
    },
    shift: {
      type: 'many-to-one',
      target: 'Shift',
      joinColumn: {
        name: 'shiftId'
      }
    },
    breakRequests: {
      type: 'one-to-many',
      target: 'BreakRequest',
      inverseSide: 'session'
    }
  },
  indices: [
    {
      name: 'IDX_AGENT_DATE',
      columns: ['agentId', 'date']
    },
    {
      name: 'IDX_SESSION_STATUS',
      columns: ['status', 'date']
    }
  ]
});

