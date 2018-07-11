const winston = require('winston');

/**
 * Utility class for .
 */
class ButterLog {
    /**
     * Initializes the .
     */
    static init(level) {
        this.logger = winston.createLogger({
            level: "info",
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.align(),
                winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            ),
            transports: [
                new winston.transports.File({filename: 'logs/error.log', level: 'error'}),
                new winston.transports.File({filename: 'logs/butter.log'})
            ]
        });

        this.logger.add(new winston.transports.Console({
            level: level || "info",
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.align(),
                winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            )
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