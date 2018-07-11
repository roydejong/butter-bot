const winston = require('winston');

/**
 * Utility class for .
 */
class ButterLog {
    /**
     * Initializes the .
     */
    static init(level) {
        this.format = winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        );

        this.logger = winston.createLogger({
            level: "info",
            format: this.format,
            transports: [
                new winston.transports.File({ filename: 'butter-error.log', level: 'error' }),
                new winston.transports.File({ filename: 'butter.log' })
            ]
        });

        this.logger.add(new winston.transports.Console({
            level: level || "info",
            format: this.format
        }));
    }

    /**
     * Helper function for module export, to fetch logger instance.
     *
     * @returns {*}
     */
    static getLogger() {
        return this.logger;
    }
}

module.exports = {
    util: ButterLog,
    default: ButterLog.getLogger
};