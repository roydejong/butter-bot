const SelfPackage = require('../../package');
const fs = require('fs');

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
        if (!this._processArgv()) {
            return false;
        }

        // Version header
        if (!this.quietMode) {
            this._logVersionHeader(true);
        }

        // Init logging / console output
        const ButterLogUtil = require('./ButterLog').util;
        ButterLogUtil.init(this.quietMode ? "warn" : "info");

        const ButterLog = ButterLogUtil.logger;

        // Initialize database
        const ButterDb = require('./ButterDb');

        try {
            ButterDb.init(this.dbFilename);
        } catch (dbErr) {
            ButterLog.error(`Could not open database file => ${dbErr.toString()}`);
            return;
        }

        ButterLog.info(`Using database file ${ButterDb.getFilename()}`);
    }

    /**
     * Processes command line arguments and configures Butterbot accordingly.
     *
     * @private
     * @return {boolean} Returns true if execution should continue; false if execution should halt.
     */
    static _processArgv() {
        let argv = require('minimist')(process.argv.slice(2));

        // Help / usage text
        if (argv["help"] || argv.h) {
            this._logVersionHeader(true);
            this._logHelpText();
            return false;
        }

        // Version text
        if (argv["version"] || argv.v) {
            this._logVersionHeader();
            return false;
        }

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

        return true;
    }

    /**
     * Writes the application help / usage text to stdout.
     *
     * @private
     */
    static _logHelpText() {
        let raw = fs.readFileSync(__dirname + "/../../etc/help+usage.txt", "utf8");
        console.log(raw);
    }

    /**
     * Writes the application version / license header to stdout.
     *
     * @param {boolean} extraSpacing - If true, add extra newline after output.
     * @private
     */
    static _logVersionHeader(extraSpacing) {
        console.log(`Butter Bot [Version ${SelfPackage.version}] (https://opdroid.com)`);
        console.log(`Copyright (c) 2018 Roy de Jong, MIT licensed`);

        if (require('node-version-compare')(SelfPackage.version, '1.0') < 0) {
            console.log("\r\n" +
                " ╭──────────────────────────────────────────────────────╮\n" +
                " │ This is pre-release software. Thank you for testing! │\n" +
                " │ ---------------------------------------------------- │\n" +
                " │ Report bugs and other feedback on GitHub:            │\n" +
                " │ https://github.com/roydejong/butter-bot/issues       │\n" +
                " ╰──────────────────────────────────────────────────────╯"
            );
        }

        if (extraSpacing) {
            console.log(" ");
        }
    }
}

module.exports = ButterBot;