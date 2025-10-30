// Explicitly require all entity files to avoid glob pattern issues
const ActivityLog = require('../models/ActivityLog');
const Admin = require('../models/Admin');
const AdminRole = require('../models/AdminRole');
const Agent = require('../models/Agent');
const AgentSession = require('../models/AgentSession');
const Approval = require('../models/Approval');
const BreakPolicy = require('../models/BreakPolicy');
const BreakRequest = require('../models/BreakRequest');
const Department = require('../models/Department');
const Permission = require('../models/Permission');
const Report = require('../models/Report');
const Role = require('../models/Role');
const RolePermission = require('../models/RolePermission');
const Shift = require('../models/Shift');
const User = require('../models/User');
const UserDocument = require('../models/UserDocument');

module.exports = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'raalc2026',
  password: process.env.DB_PASSWORD || 'Secur3P@ssw0rd!',
  database: process.env.DB_NAME || 'raalc2026',
  entities: [
    ActivityLog,
    Admin,
    AdminRole,
    Agent,
    AgentSession,
    Approval,
    BreakPolicy,
    BreakRequest,
    Department,
    Permission,
    Report,
    Role,
    RolePermission,
    Shift,
    User,
    UserDocument
  ],
  migrations: ['src/migrations/**/*.js'],
  synchronize: process.env.NODE_ENV !== 'production', // Never in production!
  dropSchema: process.env.DB_DROP_SCHEMA === 'true', // DANGER: Drops all tables on start
  logging: process.env.DB_LOGGING === 'true',
  timezone: 'Z',
  charset: 'utf8mb4',
  extra: {
    connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 10
  }
};

