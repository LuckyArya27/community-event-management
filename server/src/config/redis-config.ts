import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on('error', (error) => {
  console.error('Redis Client Error', error);
});

async function initiateRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  console.log('Redis client connected...');
}

async function clearRedisCache(keyString: string) {
  const keys = await redisClient.keys(keyString);
  if (keys.length > 0) {
    await redisClient.del(keys);
    console.log(`Cleared Redis cache for keys: ${keys.join(', ')}`);
  }
}

export { redisClient, initiateRedisClient, clearRedisCache };