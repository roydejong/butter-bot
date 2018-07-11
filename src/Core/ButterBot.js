/**
 * Main utility class for Butterbot runtime.
 */
class ButterBot {
    /**
     * Main entry point for Butterbot.
     * Starts the application and begins the task queue.
     */
    static start() {
        // Process command line arguments
        this._processArgv();

        // Version header
        const SelfPackage = require('../../package');

        if (!this.quietMode) {
            console.log(`Butter Bot [Version ${SelfPackage.version}]`);
            console.log(`Copyright (c) 2018 Roy de Jong\r\n`);
        }

        // Init logging / console output
        const ButterLogUtil = require('./ButterLog').util;
        ButterLogUtil.init(this.quietMode ? "error" : "info");

        const ButterLog = ButterLogUtil.logger;

        // Initialize database
        const ButterDb = require('./ButterDb');
        ButterDb.init(this.dbFilename);

        ButterLog.info(`Using database ${ButterDb.getFilename()}`);
    }

    /**
     * Processes command line arguments and configures Butterbot accordingly.
     *
     * @private
     */
    static _processArgv() {
        let argv = require('minimist')(process.argv.slice(2));

        /**
         * Override path to the database file (via `--db` or `-d`).
         * If left blank, default database name is used (ButterDb.DEFAULT_FILENAME).
         *
         * @type {*|null}
         */
        this.dbFilename = argv["db"] || argv.d || null;

        /**
         * Set quiet mode (via `--quiet`, `--silent` or `-q`).
         * Disables most logging except errors and warnings.
         *
         * @type {*|null}
         */
        this.quietMode = !!(argv["quiet"] || argv["silent"] || argv.q || false);
    }
}

module.exports = ButterBot;