import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  keyPrefix: process.env.REDIS_PREFIX || 'humasbpkh:',
})

export default redis
