const ButterDb = require('../Core/ButterDb');
const PackageManager = require('./PackageManager');
const Logger = require('../Core/ButterLog').logger;

/**
 * Utility class for initializing the Butter Bot package system on startup.
 */
class PackageInitializer {
    /**
     * Initializes all packages.
     */
    static bootstrapPackages() {
        return new Promise((resolve, reject) => {
            // Read all packages registered in the database file
            let packages = ButterDb.db
                .get('packages')
                .value() || [];

            // If there are no packages, bail out now
            if (!packages || !packages.length) {
                Logger.info("[bpm] No additional packages have been registered.");
                resolve();
                return;
            }

            // Begin package installation, perform each one-by-one
            // (npm does not like it if we run multiple installs at the same time)
            let idx = 0;
            let rem = packages.length;

            let countAvailable = 0;
            let countFailed = 0;

            /**
             * Routine that should be triggered when there are no packages left to install (rem == 0).
             */
            let fnDone = () => {
                if (countFailed > 0) {
                    Logger.warn(`[bpm] ${countAvailable} package(s) available. ${countFailed} failed to load.`);
                } else {
                    Logger.info(`[bpm] ${countAvailable} package(s) installed.`);
                }

                resolve();
            };

            /**
             * Routine to step to the next package to process, should be called when previous package is ready.
             */
            let fnNext = () => {
                if (rem <= 0) {
                    // Nothing left to do, trigger "done" routine
                    fnDone();
                    return;
                }

                let pkg = packages[idx];

                idx++;
                rem--;

                if (!PackageManager.isInstalled(pkg.id)) {
                    // Not yet installed
                    Logger.warn(`[bpm] Registered package \`${pkg.id}\` appears to be missing, restoring...`);

                    PackageManager.install(pkg.lock_name, false)
                        .then(() => {
                            // Install OK, step next
                            countAvailable++;
                            fnNext();
                        })
                        .catch((err) => {
                            // Install failed, step next
                            countFailed++;
                            Logger.warn(`[bpm] Could not restore package ${pkg.id}: ${err}`);
                            fnNext();
                        });
                } else {
                    // Already installed, step next
                    countAvailable++;
                    fnNext();
                }
            };

            // Start recursion
            fnNext();
        });
    }
}

module.exports = PackageInitializer;