const fs = require('fs');
const winston = require('winston');

/**
 * Utility class for .
 */
class ButterLog {
    /**
     * Initializes the .
     */
    static init(level) {
        try {
            if (!fs.existsSync('./logs')) {
                fs.mkdirSync('./logs');
            }
        } catch (e) { }

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

        if (!fs.existsSync('./logs')) {
            this.logger.warn('Could not create `logs` directory. Log files may not be written to disk.');
        }
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