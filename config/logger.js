const winston = require('winston');
const path = require('path');
const config = require('./config');

// Define log format
const logFormat = winston.format.combine(
    // winston.format.timestamp({
    //     format: 'YYYY-MM-DD HH:mm:ss'
    // }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

function getTransports() {
    let results = [];
    if(config.logger.writeToDisk) {
        results = [
            // Write all logs with importance level of 'error' or less to error.log
            new winston.transports.File({
                filename: path.join(__dirname, '../logs/error.log'),
                level: 'error'
            }),
            // Write all logs with importance level of 'info' or less to combined.log
            new winston.transports.File({
                filename: path.join(__dirname, '../logs/combined.log')
            })
        ]
    }

    return results

}

// Create logger instance
const logger = winston.createLogger({
    level: config.logger.level || 'info',
    format: logFormat,
    transports: getTransports(),
});

// If we're not in production then log to the console with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;
