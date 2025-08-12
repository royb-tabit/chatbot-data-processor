const config = require('../../config/config');
const logger = require('../../config/logger');
const isMock = config.redis?.mock;

let client;

if (isMock) {
    const redis = require('redis-mock');
    const { promisify } = require('util');
    client = redis.createClient();

    // Patch Redis-mock to support Promises like redis@4
    client.get = promisify(client.get).bind(client);
    client.set = promisify(client.set).bind(client);
} else {
    const redis = require('redis');
    client = redis.createClient({ url: config.redis.url });
    client.connect().catch(logger.error);
}

module.exports = {getSession, setSession};
