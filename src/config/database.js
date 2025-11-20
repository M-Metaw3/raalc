// Explicitly require all entity files to avoid glob pattern issues
const ActivityLog = require('../models/ActivityLog');
const AdditionalService = require('../models/AdditionalService');
const Admin = require('../models/Admin');
const AdminRole = require('../models/AdminRole');
const Agent = require('../models/Agent');
const AgentSession = require('../models/AgentSession');
const ApplicationType = require('../models/ApplicationType');
const Approval = require('../models/Approval');
const BreakPolicy = require('../models/BreakPolicy');
const BreakRequest = require('../models/BreakRequest');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const Permission = require('../models/Permission');
const Report = require('../models/Report');
const RequestDocument = require('../models/RequestDocument');
const Role = require('../models/Role');
const RolePermission = require('../models/RolePermission');
const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');
const Shift = require('../models/Shift');
const User = require('../models/User');
const UserDocument = require('../models/UserDocument');
// Chat System Models
// const Chat = require('../models/Chat');
// const Message = require('../models/Message');
// const MessageAttachment = require('../models/MessageAttachment');
module.exports = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  // username: process.env.DB_USER || 'raalc2026',
  // username: process.env.DB_USER || 'root',
  username: process.env.DB_USER || 'raalc2026',
  password: process.env.DB_PASSWORD || 'Secur3P@ssw0rd!',
  // password: process.env.DB_PASSWORD || '',
  // password: process.env.DB_PASSWORD || '',
synchronize: true, // ⚠️ Disabled temporarily to fix FK error
  database: process.env.DB_NAME || 'raalc2026',
  // database: process.env.DB_NAME || 'raalc_db',
  // database: process.env.DB_NAME || 'raalc_db',
  entities: [
    ActivityLog,
    AdditionalService,
    Admin,
    AdminRole,
    Agent,
    AgentSession,
    ApplicationType,
    Approval,
    BreakPolicy,
    BreakRequest,
    Complaint,
    Department,
    Permission,
    Report,
    RequestDocument,
    Role,
    RolePermission,
    Service,
    ServiceRequest,
    Shift,
    User,
    UserDocument,
    // Chat System
    // Chat,
    // Message,
    Complaint,
    // MessageAttachment
  ],
  migrations: ['src/migrations/**/*.js'],
  synchronize: false, // ⚠️ Disabled temporarily to fix FK error
  dropSchema: process.env.DB_DROP_SCHEMA === 'true', // DANGER: Drops all tables on start
  logging: process.env.DB_LOGGING === 'true',
  timezone: 'Z',
  charset: 'utf8mb4',
  extra: {
    connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 10
  }
};

