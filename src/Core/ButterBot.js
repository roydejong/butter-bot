const SelfPackage = require('../../package');
const fs = require('fs');
const minimist = require('minimist');

/**
 * Main utility class for Butterbot runtime.
 */
class ButterBot {
    /**
     * Main entry point for Butterbot.
     * Starts the application and begins the task queue.
     *
     * @param {string[]} argv - Command line arguments, usually provided by `process.argv`. Must be pre-sliced.
     * @param {boolean} bootstrapOnly - If true, only bootstrap the app and do not begin main event loop.
     */
    static start(argv, bootstrapOnly) {
        // Parse command line arguments
        if (argv) {
            try {
                argv = minimist(argv);
            } catch (e) {
                console.error('Command line arguments could not be parsed.');
            }
        }
        if (!argv) argv = {};

        // Process command line arguments
        if (!this._processArgv(argv, false)) {
            return false;
        }

        // Version header
        if (!this.quietMode) {
            this._logVersionHeader(true);
        }

        // Init logging / console output
        const ButterLogUtil = require('./ButterLog');
        ButterLogUtil.init(this.noStdout ? null : (this.quietMode ? "warn" : "info"));
        const logger = ButterLogUtil.getLogger();

        // Initialize database
        const ButterDb = require('./ButterDb');

        try {
            ButterDb.init(this.dbFilename);
        } catch (dbErr) {
            logger.error(`[init] Could not open database file => ${dbErr.toString()}.`);
            return;
        }

        logger.info(`[init] Using database file ${ButterDb.getFilename()}.`);

        // Process command line arguments - level two (package maintenance etc)
        if (!this._processArgv(argv, true)) {
            return false;
        }

        // Initialize package system
        const PkgInit = require('../Packages/PackageInitializer');
        const TaskEngine = require('../Tasks/TaskEngine');

        return PkgInit.bootstrapPackages()
            .then(() => {
                if (!bootstrapOnly) {
                    this.taskEngine = new TaskEngine();
                    this.taskEngine.scheduleNext(true);

                    logger.info(`✅ Butter Bot has started successfully.`);
                }
            })
            .catch((err) => {
                logger.error(`[init] Failed to initialize package system.`);
                console.error(err);
                process.exit(-1);
            });
    }

    /**
     * Processes command line arguments and configures Butterbot accordingly.
     *
     * @private
     * @param {object} argv - Parsed argv object.
     * @param {boolean} levelTwo - If true, process level two arguments (package maintenance commands).
     * @return {boolean} Returns true if execution should continue; false if execution should halt.
     */
    static _processArgv(argv, levelTwo) {
        if (levelTwo) {
            // --- Package maintenance ---------------------------------------------------------------------------------
            const Bpm = require('../Packages/PackageManager');
            const logger = require('./ButterLog').logger;

            let pkgToInstall = argv["install"] || argv.i || null;

            if (pkgToInstall) {
                if (typeof pkgToInstall === "string" && pkgToInstall.length) {
                    Bpm.install(pkgToInstall, true)
                        .catch(() => {
                            // Install failed, but should already have been logged by installer or npm.
                            // Ensure we exit with a non-zero exit code.
                            process.exit(-1);
                        });
                } else {
                    logger.error(`Usage: butterbot (--install|-i) <packageName>`);
                }

                return false;
            }
        } else {
            // --- Help / usage text -----------------------------------------------------------------------------------
            if (argv["help"] || argv.h) {
                this._logVersionHeader(true);
                this._logHelpText();
                return false;
            }

            if (argv["version"] || argv.v) {
                this._logVersionHeader();
                return false;
            }

            // --- Normal usage ----------------------------------------------------------------------------------------
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

            /**
             * Disable stdout (console) output (via `--no-stdout`).
             * Does not affect logging.
             *
             * @type {boolean}
             */
            this.noStdout = (!argv["stdout"] || false);
        }

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
        console.log(`🤖 Butter Bot [Version ${SelfPackage.version}] (https://butterbot.io)`);
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