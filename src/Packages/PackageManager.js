const fs = require('fs');
const logger = require('../Core/ButterLog').logger;
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
     * @param {string} pkgSpec - The spec for the npm package to install or update, e.g. "tar@4.4.4".
     * @param {boolean} force - If true, force installation or update even if package is already installed.
     *                          If false, updating will not occur and only new installations are processed.
     * @returns {Promise}
     */
    static install(pkgSpec, force) {
        let pkgName = PackageManager.getPackageName(pkgSpec);

        return new Promise((resolve, reject) => {
            let isInstalled = PackageManager.isInstalled(pkgSpec);

            if (isInstalled && !force) {
                logger.warn(`[bpm] SKIP: Not installing package ${pkgName} as it is already installed.`);
                reject("Package already installed, and not forcing installation.");
                return;
            }

            logger.info(`[bpm] Going to install npm package: ${pkgSpec}.`);

            try {
                let npmOptions = {
                    loaded: false,
                    global: false,
                    save: true,
                    audit: false
                };

                npm.load(npmOptions, (initErr) => {
                    if (initErr) {
                        logger.error(`[bpm] (install:${pkgName}) Could not initialize npm: ${initErr.toString()}`);
                        reject("Could not initialize npm.");
                        return;
                    }

                    npm.commands.install([pkgSpec], (installErr, installList) => {
                        if (installErr) {
                            logger.error(`[bpm] (install:${pkgName}) npm\t\t${installErr.toString()}`);
                            reject("npm returned an error during installation.");
                            return;
                        }

                        logger.debug(`[bpm] (install:${pkgName}) npm package installation completed.`);

                        let installedSpec = null;
                        let installedPath = null;

                        // Data contains a list of installed/updated packages (including dependencies)
                        // Iterate through until we find the package that we wanted to install
                        for (let i = 0; i < installList.length; i++) {
                            let _insItem = installList[i];

                            let _pkgSpec = _insItem[0];
                            let _pkgName = PackageManager.getPackageName(_pkgSpec);
                            let _pkgPath = _insItem[1];

                            logger.debug(`[bpm] (install:${pkgName}) --> ${_pkgSpec} (${_pkgPath})`);

                            if (_pkgName === pkgName) {
                                // This is the package we actually wanted to install
                                installedSpec = _pkgSpec;
                                installedPath = _pkgPath;
                            }
                        }

                        if (!installedPath || !installedSpec) {
                            logger.error(`[bpm] (install:${pkgName}) npm did not install the expected module.`);
                            reject("Sanity check failed (A), package does not appear to be installed correctly.");
                            return;
                        }

                        if (!this.isInstalled(pkgName)) {
                            logger.error(`[bpm] (install:${pkgName}) Package was installed, but module cannot be loaded (sanity check failed).`);
                            reject("Sanity check failed (B), package does not appear to be installed correctly.");
                            return;
                        }

                        let manifestPathExpected = installedPath + "/butterbot.json";

                        if (!fs.existsSync(manifestPathExpected)) {
                            logger.error(`[bpm] (install:${pkgName}) Package was installed locally, but it does not look like a valid butterbot package. A manifest file was expected at path: ${manifestPathExpected}`);
                            reject("The installed package is not a valid butterbot package.");
                            return;
                        }

                        this.register(installedSpec, installedPath);
                        resolve(installList);
                    });
                });
            } catch (e) {
                reject(e || "An unexpected error occurred.");
            }
        });
    }

    /**
     * Reduces a package's full identifier to remove any tag/version info and just keep the package name.
     * Converts e.g. "tar@4.4.4" to "tar".
     *
     * @param {string} pkgSpec - Full npm spec string, e.g. "tar@4.4.4"
     * @returns {string}
     */
    static getPackageName(pkgSpec) {
        if (pkgSpec) {
            let atIdx = pkgSpec.indexOf('@');

            if (atIdx >= 0) {
                return pkgSpec.substr(0, atIdx);
            }
        }

        return pkgSpec;
    }

    /**
     * Registers a package.
     *
     * @param {string} pkgSpec - Name and tag of the package installed by npm, e.g. "tar@4.4.4".
     * @param {string} pkgPath - Full absolute path to the installation directory in node_modules.
     */
    static register(pkgSpec, pkgPath) {
        let pkgName = PackageManager.getPackageName(pkgSpec);

        let pkgDataCurrent = ButterDb.db
            .get('packages')
            .find({ id: pkgName })
            .value();

        if (!pkgDataCurrent) {
            // Package is not yet in database, create stub
            pkgDataCurrent = {
                id: pkgName,
                registered_at_initial: new Date()
            };

            ButterDb.db
                .get('packages')
                .push(pkgDataCurrent)
                .write();

            logger.debug(`[bpm] (install:${pkgName}) Registering as new package to local db.`);
        } else {
            // Package already registerd
            logger.debug(`[bpm] (install:${pkgName}) Updating existing package registration in local db.`);
            logger.debug(`[bpm] (install:${pkgName}) Previous registration data: ${JSON.stringify(pkgDataCurrent)}`);
        }

        // Perform update (either on new stub; or existing package reg)
        let registerValues = {
            registered_at: new Date(),
            lock_name: pkgSpec,
            path: pkgPath
        };

        logger.debug(`[bpm] (install:${pkgName}) Writing data to registration: ${JSON.stringify(registerValues)}`);

        ButterDb.db
            .get('packages')
            .find({ id: pkgName })
            .assign(registerValues)
            .write();

        logger.info(`[bpm] (install:${pkgName}) ✅ OK. Package ${pkgSpec} was installed and registered.`);
    }

    /**
     * Safe method for determining whether a package is installed.
     *
     * @param {string} pkgIdent - Package name (e.g. "tar") or npm spec string (e.g. "tar@4.4.4") to check.
     * @returns {boolean} Returns true if package appears to resolve OK, or is available for require().
     */
    static isInstalled(pkgIdent) {
        let pkgName = this.getPackageName(pkgIdent);

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
