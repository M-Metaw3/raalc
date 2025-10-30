const { Queue, Worker, QueueScheduler } = require('bullmq');
const { redisConfig } = require('../config/redis');
const logger = require('../utils/logger');

// Redis connection for BullMQ
const connection = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  db: redisConfig.db
};

// Define all queues
const queues = {
  email: new Queue('email', { connection }),
  notification: new Queue('notification', { connection }),
  cleanup: new Queue('cleanup', { connection }),
  fileProcessing: new Queue('file-processing', { connection })
};

/**
 * Initialize queue schedulers
 * Required for delayed/scheduled jobs
 */
function initSchedulers() {
  new QueueScheduler('email', { connection });
  new QueueScheduler('notification', { connection });
  new QueueScheduler('cleanup', { connection });
  new QueueScheduler('file-processing', { connection });
  
  logger.info('✅ Queue schedulers initialized');
}

/**
 * Add job to queue with default options
 */
async function addJob(queueName, jobName, data, options = {}) {
  if (!queues[queueName]) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
  const defaultOptions = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  };
  
  return queues[queueName].add(jobName, data, { ...defaultOptions, ...options });
}

/**
 * Get queue metrics
 */
async function getQueueMetrics(queueName) {
  if (!queues[queueName]) {
    throw new Error(`Queue ${queueName} not found`);
  }
  
  const queue = queues[queueName];
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount()
  ]);
  
  return {
    name: queueName,
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed
  };
}

module.exports = {
  queues,
  connection,
  Worker,
  QueueScheduler,
  initSchedulers,
  addJob,
  getQueueMetrics
};

