const fs = require('fs');
const winston = require('winston');

/**
 * Utility class for logging.
 */
class ButterLog {
    /**
     * Initializes the logger and its outputs.
     *
     * @param {boolean} debugMode - If true, enable full (verbose) debug logging for all transports by default. This option takes precedence over `quietMode`.
     * @param {boolean} quietMode - If true, reduce logging to warnings and errors only for all transports by default. Cannot be combined with `debugMode`.
     * @param {boolean} noStdout - If true, disable stdout / console output transport completely.
     * @return {Object} Winston logger instance
     */
    static init(debugMode, quietMode, noStdout) {
        try {
            if (!fs.existsSync('./logs')) {
                fs.mkdirSync('./logs');
            }
        } catch (e) { }

        let baseLogLevel = "info";
        let errorLogLevel = "error";

        if (debugMode) {
            baseLogLevel = "debug";
        }

        this.logger = winston.createLogger({
            name: "butterlog",
            level: baseLogLevel,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.align(),
                winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            ),
            transports: [
                new winston.transports.File({filename: 'logs/error.log', level: errorLogLevel}),
                new winston.transports.File({filename: 'logs/butter.log', level: baseLogLevel})
            ]
        });

        if (!noStdout) {
            let consoleLogLevel = baseLogLevel;

            if (!debugMode && quietMode) {
                // If quiet mode is on, reduce console log level to warnings and errors only.
                consoleLogLevel = "warn";
            }

            this.logger.add(new winston.transports.Console({
                level: consoleLogLevel,
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp(),
                    winston.format.align(),
                    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
                )
            }));
        }

        if (!fs.existsSync('./logs')) {
            this.logger.warn('Could not create `logs` directory. Log files may not be written to disk.');
        }

        if (baseLogLevel === "debug") {
            this.logger.debug('Verbose / debug logging is activated for this session.');
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