const { EntitySchema } = require('typeorm');

/**
 * BreakPolicy Model
 * 
 * Defines break rules for each shift
 */
module.exports = new EntitySchema({
  name: 'BreakPolicy',
  tableName: 'break_policies',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    shiftId: {
      type: 'int',
      nullable: false,
      unique: true,
      unsigned: true
    },
    maxBreaksPerDay: {
      type: 'int',
      default: 2,
      comment: 'Maximum number of breaks allowed per day'
    },
    minDuration: {
      type: 'int',
      default: 10,
      comment: 'Minimum break duration in minutes'
    },
    maxDuration: {
      type: 'int',
      default: 30,
      comment: 'Maximum break duration in minutes'
    },
    autoApproveLimit: {
      type: 'int',
      default: 15,
      comment: 'Auto-approve breaks up to this duration (minutes)'
    },
    cooldownMinutes: {
      type: 'int',
      default: 90,
      comment: 'Minimum minutes between breaks'
    },
    preferredStartTime: {
      type: 'time',
      nullable: true,
      comment: 'Preferred break start time window'
    },
    preferredEndTime: {
      type: 'time',
      nullable: true,
      comment: 'Preferred break end time window'
    },
    blockDuringMeetings: {
      type: 'boolean',
      default: false,
      comment: 'Block breaks during meetings/critical events'
    },
    meetingBufferMinutes: {
      type: 'int',
      default: 10,
      nullable: true,
      comment: 'Minutes before meeting to block breaks'
    },
    allowedBreakTypes: {
      type: 'varchar',
      length: 500,
      default: 'short,lunch,emergency',
      comment: 'Allowed break types: short, lunch, emergency',
      transformer: {
        to: (value) => {
          if (Array.isArray(value)) {
            return value.join(',');
          }
          return value;
        },
        from: (value) => {
          if (typeof value === 'string') {
            return value.split(',').map(v => v.trim());
          }
          return value || ['short', 'lunch', 'emergency'];
        }
      }
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
    shift: {
      type: 'one-to-one',
      target: 'Shift',
      joinColumn: {
        name: 'shiftId'
      }
    }
  }
});

