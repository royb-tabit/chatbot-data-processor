require('dotenv').config({
    path: determineEnvFile()
});

function determineEnvFile() {
    const env = process.env.NODE_ENV;
    if (env) {
        return `.env.${env}`;
    }
    return '.env.local';
}

function createConfigFromEnv() {
    return {
        port: parseInt(process.env.PORT),
        db: {
            tdCatalog: {
                mongoUri: process.env.TDCATALOG_MONGODB_URI
            }
        },
        logger: {
            level: process.env.LOGGER_LEVEL,
            writeToDisk: process.env.LOGGER_WRITE_TO_DISK
        }
    };
}

const config = createConfigFromEnv();

module.exports = config;
