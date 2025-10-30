const { EntitySchema } = require('typeorm');

/**
 * Shift Model
 * 
 * Defines work shifts (صباحي، مسائي، من المنزل)
 */
module.exports = new EntitySchema({
  name: 'Shift',
  tableName: 'shifts',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    name: {
      type: 'varchar',
      length: 50,
      nullable: false
    },
    nameAr: {
      type: 'varchar',
      length: 50,
      nullable: false
    },
    startTime: {
      type: 'time',
      nullable: false,
      comment: 'Shift start time (HH:MM:SS)'
    },
    endTime: {
      type: 'time',
      nullable: false,
      comment: 'Shift end time (HH:MM:SS)'
    },
    gracePeriod: {
      type: 'int',
      default: 0,
      comment: 'Grace period in minutes for late check-in'
    },
    allowOvertime: {
      type: 'boolean',
      default: false
    },
    overtimeRequiresApproval: {
      type: 'boolean',
      default: true
    },
    maxOvertimeMinutes: {
      type: 'int',
      default: 0,
      nullable: true,
      comment: 'Maximum overtime minutes allowed per day'
    },
    assignmentType: {
      type: 'enum',
      enum: ['all', 'department', 'specific'],
      default: 'all',
      comment: 'How shift is assigned: all agents, by department, or specific agents'
    },
    departmentId: {
      type: 'int',
      nullable: true,
      unsigned: true,
      comment: 'Department ID if assignmentType is department'
    },
    isActive: {
      type: 'boolean',
      default: true
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
    department: {
      type: 'many-to-one',
      target: 'Department',
      joinColumn: {
        name: 'departmentId'
      },
      nullable: true
    },
    breakPolicy: {
      type: 'one-to-one',
      target: 'BreakPolicy',
      inverseSide: 'shift'
    },
    agents: {
      type: 'one-to-many',
      target: 'Agent',
      inverseSide: 'shift'
    }
  }
});

