const fs = require('fs');
const winston = require('winston');

/**
 * Utility class for logging.
 */
class ButterLog {
    /**
     * Initializes the logger and its outputs.
     *
     * @return {object} Winston logger instance
     */
    static init(level) {
        try {
            if (!fs.existsSync('./logs')) {
                fs.mkdirSync('./logs');
            }
        } catch (e) { }

        this.logger = winston.createLogger({
            name: "butterlog",
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

        return this.logger;
    }

    /**
     * Helper function for module export, to fetch logger instance.
     *
     * @returns {object|null}
     */
    static getLogger() {
        if (this.logger) {
            return this.logger;
        }

        return winston.loggers.get('butterlog') || null;
    }
}

module.exports = ButterLog;