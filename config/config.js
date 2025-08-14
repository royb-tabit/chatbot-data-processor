require('dotenv').config();

function createConfigFromEnv() {
    return {
        port: parseInt(process.env.PORT || 3000),
        db: {
            tdCatalog: {
                mongoUri: process.env.TDCATALOG_MONGODB_URI || 'mongodb://localhost:27017',
                dbName: process.env.TDCATALOG_MONGODB_DB || 'test'
            }
        },
        logger: {
            level: process.env.LOGGER_LEVEL || 'info',
            writeToDisk: process.env.LOGGER_WRITE_TO_DISK || false
        }
    };
}

const config = createConfigFromEnv();

module.exports = config;
