const ButterDb = require('./ButterDb');

/**
 * Main utility class for Butterbot runtime.
 */
class Butterbot {
    /**
     * Main entry point for Butterbot.
     * Starts the application and begins the task queue.
     */
    static start() {
        this._processArgv();

        // Initialize database
        console.log(this.dbFilename);
        ButterDb.init(this.dbFilename);
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
    }
}

module.exports = Butterbot;