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
     * @param {string} pkgName - The name of the npm package to install or update.
     * @param {boolean} force - If true, force installation or update even if package is already installed.
     *                          If false, updating will not occur and only new installations are processed.
     * @returns {Promise}
     */
    static install(pkgName, force) {
        let isInstalled = this.isInstalled(pkgName);

        if (isInstalled && !force) {
            Logger.warn(`[bpm] SKIP: Not installing package ${pkgName} as it is already installed.`);
            return false;
        }

        Logger.info(`[bpm] Going to install npm package: ${pkgName}.`);

        return new Promise((resolve, reject) => {
            let npmOptions = {
                loaded: false,
                global: false,
                save: false
            };

            npm.load(npmOptions, (initErr) => {
                if (initErr) {
                    Logger.error(`[bpm] (install:${pkgName}) Could not initialize npm: ${initErr.toString()}`);
                    reject(initErr);
                    return;
                }

                npm.commands.install([pkgName], (installErr, data) => {
                    if (installErr) {
                        Logger.error(`[bpm] (install:${pkgName}) npm\t\t${installErr.toString()}`);
                        reject(initErr);
                        return;
                    }

                    Logger.debug(`[bpm] (install:${pkgName}) npm package was installed successfully.`);
                    this.register(pkgName);
                    resolve(data);
                });
            });
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
     * Safe method for determining whether a package is installed.
     *
     * @param {string} pkgName - Name of the node module to resolve.
     * @returns {boolean} Returns true if package appears to be available.
     */
    static isInstalled(pkgName) {
        if (pkgName.indexOf('@')) {
            // Remove npm @tags from the package name
            let tagIdx = pkgName.indexOf('@');
            pkgName = pkgName.substr(0, tagIdx);
        }

        // Strategy #1: Use require.resolve to see if we get a result
        try {
            require.resolve(pkgName);
            return true;
        } catch (e) {
            console.debug(e);
        }

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

            console.debug(e);
        }

        return false;
    }
}

module.exports = PackageManager;