const Logger = require('../Core/ButterLog').util.getLogger();
const npm = require('npm');
const ButterDb = require('../Core/ButterDb');

/**
 * BPM - Butterbot Package Manager
 * Main utility class for working with butterbot packages /submodules.
 */
class PackageManager {
    /**
     * Installs a single package.
     *
     * @param {string} pkgTag - The name of the npm package to install or update.
     * @param {boolean} force - If true, force installation or update even if package is already installed.
     *                          If false, updating will not occur and only new installations are processed.
     * @returns {Promise}
     */
    static install(pkgTag, force) {
        return new Promise((resolve, reject) => {
            let isInstalled = PackageManager.isInstalled(pkgTag);

            if (isInstalled && !force) {
                Logger.warn(`[bpm] SKIP: Not installing package ${pkgTag} as it is already installed.`);
                reject("Package already installed, and not forcing installation.");
                return;
            }

            Logger.info(`[bpm] Going to install npm package: ${pkgTag}.`);

            try {
                let npmOptions = {
                    loaded: false,
                    global: false,
                    save: false,
                    force: force,
                    audit: false
                };

                npm.load(npmOptions, (initErr) => {
                    if (initErr) {
                        Logger.error(`[bpm] (install:${pkgTag}) Could not initialize npm: ${initErr.toString()}`);
                        reject("Could not initialize npm.");
                        return;
                    }

                    npm.commands.install([pkgTag], (installErr, data) => {
                        if (installErr) {
                            Logger.error(`[bpm] (install:${pkgTag}) npm\t\t${installErr.toString()}`);
                            reject("npm returned an error during installation.");
                            return;
                        }

                        Logger.debug(`[bpm] (install:${pkgTag}) npm package installation completed.`);

                        if (!this.isInstalled(pkgTag)) {
                            Logger.error(`[bpm] (install:${pkgTag}) Package was installed, but module cannot be loaded (sanity check failed).`);
                            reject("Sanity check failed, package does not appear to be installed correctly.");
                            return;
                        }

                        this.register(pkgTag);
                        resolve(data);
                    });
                });
            } catch (e) {
                reject(e || "An unexpected error occurred.");
            }
        });
    }

    /**
     * Registers a package.
     *
     * @param {string} pkgName
     */
    static register(pkgName) {
        let pkgNameTagIdx = pkgName.indexOf('@');
        let pkgNameNoTag = pkgNameTagIdx >= 0 ? pkgName.substr(0, pkgNameTagIdx) : pkgName;

        let pkgDataCurrent = ButterDb.db
            .get('packages')
            .find({ id: pkgNameNoTag })
            .value();

        if (!pkgDataCurrent) {
            // Package is not yet in database, create stub
            pkgDataCurrent = { id: pkgNameNoTag };

            ButterDb.db
                .get('packages')
                .push(pkgDataCurrent)
                .write();

            Logger.debug(`[bpm] (install:${pkgName}) Registering as new package.`);
        } else {
            // Package already registerd
            Logger.debug(`[bpm] (install:${pkgName}) Updating existing package registration.`);
        }

        // Perform update (either on new stub; or existing package reg)
        let registerValues = {
            registered_at: new Date(),
            lock_name: pkgName
        };

        ButterDb.db
            .get('packages')
            .find({ id: pkgNameNoTag })
            .assign(registerValues)
            .write();

        Logger.info(`[bpm] (install:${pkgName}) ✅ OK. The package has been installed and registered to Butter Bot.`);
    }

    /**
     * Strips npm specific markup from a package name.
     * Example: When inputting "package@latest", this returns "latest".
     *
     * @param {string} pkgName - Full package name, including npm tags / markup.
     * @returns {string}
     */
    static reducePkgName(pkgName) {
        if (pkgName.indexOf('@') >= 0) {
            // Remove npm @tags from the package name
            let tagIdx = pkgName.indexOf('@');
            pkgName = pkgName.substr(0, tagIdx);
        }

        return pkgName;
    }

    /**
     * Safe method for determining whether a package is installed.
     *
     * @param {string} pkgName - Name of the node module to resolve.
     * @returns {boolean} Returns true if package appears to be available.
     */
    static isInstalled(pkgName) {
        pkgName = this.reducePkgName(pkgName);

        // Strategy #1: Use require.resolve to see if we get a result
        try {
            require.resolve(pkgName);
            return true;
        } catch (e) { }

        // Strategy #2: Attempt direct require
        try {
            let module = require(pkgName);

            if (module) {
                return true;
            }
        } catch (e) {
            if (e.code === 'MODULE_NOT_FOUND') {
                return false;
            }
        }

        return false;
    }
}

module.exports = PackageManager;