const { EntitySchema } = require('typeorm');

/**
 * Department Model
 * 
 * Represents departments/sections (أسرة، عمل، ميراث، إلخ)
 */
module.exports = new EntitySchema({
  name: 'Department',
  tableName: 'departments',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
      unsigned: true
    },
    name: {
      type: 'varchar',
      length: 100,
      nullable: false,
      unique: true
    },
    nameAr: {
      type: 'varchar',
      length: 100,
      nullable: false,
      comment: 'Arabic name'
    },
    description: {
      type: 'text',
      nullable: true
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
    agents: {
      type: 'one-to-many',
      target: 'Agent',
      inverseSide: 'department'
    },
    shifts: {
      type: 'one-to-many',
      target: 'Shift',
      inverseSide: 'department'
    }
  }
});

