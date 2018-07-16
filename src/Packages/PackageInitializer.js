const ButterDb = require('../Core/ButterDb');
const PackageManager = require('./PackageManager');
const logger = require('../Core/ButterLog').logger;
const PackageLoader = require('../Packages/PackageLoader');

/**
 * Utility for verifying and automatic maintenance for registered packages.
 */
class PackageInitializer {
    /**
     * Initializes all packages.
     *
     * @return Promise<Object[]> Resolves with a list of loaded packages ("packages" database record values).
     */
    static bootstrapPackages() {
        return new Promise((resolve, reject) => {
            // Read all packages registered in the database file
            let packages = ButterDb.db
                .get('packages')
                .value() || [];

            // If there are no packages, bail out now
            if (!packages || !packages.length) {
                logger.info("[bpm] No additional packages have been registered.");
                resolve();
                return;
            }

            // Begin package installation, perform each one-by-one
            // (npm does not like it if we run multiple installs at the same time)
            let idx = 0;
            let rem = packages.length;

            let countFailed = 0;
            let pkgListAv = [];

            /**
             * Routine that should be triggered when there are no packages left to install (rem == 0).
             * Processes the loaded packages, then logs and returns the output.
             */
            let fnDone = () => {
                // Process manifests & load what we need to load into our repositories (like tasks - kinda important)
                let loaderStats = PackageLoader.loadFromDatabaseList(pkgListAv);

                // Done
                let countAvailable = pkgListAv.length;
                let countTasks = loaderStats.tasks || 0;

                logger.info(`[bpm] ${countTasks} task(s) available from ${countAvailable} package(s).`);

                if (countFailed > 0) {
                    logger.warn(`[bpm] ${countFailed} package(s) failed to load and are unavailable.`);
                }

                resolve(pkgListAv);
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
                    logger.warn(`[bpm] Registered package \`${pkg.id}\` appears to be missing, restoring...`);

                    PackageManager.install(pkg.lock_name, false)
                        .then(() => {
                            // Install OK, step next
                            pkgListAv.push(pkg);
                            fnNext();
                        })
                        .catch((err) => {
                            // Install failed, step next
                            countFailed++;
                            logger.warn(`[bpm] Could not restore package ${pkg.id}: ${err}`);
                            fnNext();
                        });
                } else {
                    // Already installed, step next
                    pkgListAv.push(pkg);
                    fnNext();
                }
            };

            // Start recursion
            fnNext();
        });
    }
}

module.exports = PackageInitializer;
