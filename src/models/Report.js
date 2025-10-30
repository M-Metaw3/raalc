const { EntitySchema } = require('typeorm');

/**
 * Report Model
 * 
 * Daily performance and attendance reports
 */
module.exports = new EntitySchema({
  name: 'Report',
  tableName: 'reports',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    date: {
      type: 'date',
      nullable: false,
      comment: 'Report date (YYYY-MM-DD)'
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
      comment: 'Related session'
    },
    totalWorkMinutes: {
      type: 'int',
      default: 0,
      comment: 'Total work minutes (excluding breaks)'
    },
    totalBreaks: {
      type: 'int',
      default: 0,
      comment: 'Number of breaks taken'
    },
    totalBreakMinutes: {
      type: 'int',
      default: 0,
      comment: 'Total break duration in minutes'
    },
    overtimeMinutes: {
      type: 'int',
      default: 0,
      comment: 'Overtime minutes worked'
    },
    lateMinutes: {
      type: 'int',
      default: 0,
      comment: 'Minutes late for check-in'
    },
    checkInTime: {
      type: 'time',
      nullable: true
    },
    checkOutTime: {
      type: 'time',
      nullable: true
    },
    attendanceStatus: {
      type: 'enum',
      enum: ['present', 'late', 'absent', 'on_leave', 'incomplete'],
      default: 'present'
    },
    performanceScore: {
      type: 'float',
      nullable: true,
      comment: 'Performance score based on attendance, breaks, etc.'
    },
    violations: {
      type: 'simple-json',
      nullable: true,
      comment: 'List of policy violations: {type, description, severity}'
    },
    notes: {
      type: 'text',
      nullable: true
    },
    metadata: {
      type: 'simple-json',
      nullable: true,
      comment: 'Additional metrics and data'
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
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    session: {
      type: 'many-to-one',
      target: 'AgentSession',
      joinColumn: {
        name: 'sessionId'
      },
      nullable: true,
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  },
  indices: [
    {
      name: 'IDX_REPORT_DATE',
      columns: ['date', 'agentId'],
      unique: true
    },
    {
      name: 'IDX_REPORT_PERFORMANCE',
      columns: ['date', 'performanceScore']
    },
    {
      name: 'IDX_REPORT_ATTENDANCE',
      columns: ['attendanceStatus', 'date']
    }
  ]
});

