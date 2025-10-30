module.exports = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'raalc_db',
  entities: ['src/models/**/*.js'],
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

