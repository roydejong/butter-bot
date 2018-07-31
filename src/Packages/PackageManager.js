const fs = require('fs');
const logger = require('../Core/ButterLog').logger;
const npm = require('npm');
const ButterDb = require('../Core/ButterDb');
const ButterbotManifest = require('./Manifest');

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

                        // Verify the package was installed OK. This is a sanity check for the most part, but also
                        // prevents us from registering a package with no butterbot manifest.
                        let packageFailReason = null;

                        if (!installedSpec) {
                            packageFailReason = "npm installation failed, or package name did not match";
                        } else if (!installedPath) {
                            packageFailReason = "could not determine installation path for package";
                        } else if (!this.isInstalled(installedSpec)) {
                            packageFailReason = "package installed, but does not appear to have a valid manifest file";
                        }

                        if (packageFailReason) {
                            logger.error(`[bpm] (install:${pkgName}) Post-install check failed: ${packageFailReason}`);
                            reject(`Package installation failed: (${packageFailReason})`);
                            return;
                        }

                        this.registerInstalledPackage(installedSpec, installedPath);
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
        // TODO Figure out how to do this more reliably

        if (pkgSpec) {
            pkgSpec = pkgSpec.trim();

            // Strip "@latest" and similar tags
            // <name>@<version>, <name>@<tag>, etc
            let atIdx = pkgSpec.indexOf('@');

            if (atIdx >= 0) {
                pkgSpec = pkgSpec.substr(0, atIdx);
            }

            // Remove any trailing slashes
            if (pkgSpec.substr(-1) === '/') {
                pkgSpec = pkgSpec.substr(0, pkgSpec.length - 1);
            }

            // Strip slashes and URLs, only keep last part
            // Folders, <git-host>:<git-user>/<repo-name> etc
            let slashIdx = pkgSpec.lastIndexOf('/');

            if (slashIdx >= 0) {
                pkgSpec = pkgSpec.substr(slashIdx + 1);
            }
        }

        return pkgSpec;
    }

    /**
     * Fetches registration info from
     *
     * @param {string} pkgIdent - Package name (e.g. "tar") or npm spec string (e.g. "tar@4.4.4") to check.
     * @returns {Object|null} Returns the database object value, or NULL if package is not known to us.
     */
    static getRegistration(pkgIdent) {
        let pkgName = PackageManager.getPackageName(pkgIdent);

        let pkgDataCurrent = ButterDb.db
            .get('packages')
            .find({ id: pkgName })
            .value();

        return pkgDataCurrent || null;
    }

    /**
     * Registers a package.
     *
     * @param {string} pkgSpec - Name and tag of the package installed by npm, e.g. "tar@4.4.4".
     * @param {string} pkgPath - Full absolute path to the installation directory in node_modules.
     */
    static registerInstalledPackage(pkgSpec, pkgPath) {
        let pkgName = PackageManager.getPackageName(pkgSpec);
        let pkgDataCurrent = PackageManager.getRegistration(pkgName);

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

        logger.info(`[bpm] (install:${pkgName}) ✅  OK: ${pkgSpec}`);
    }

    /**
     * Safe method for determining whether a package is installed.
     *
     * @param {string} pkgIdent - Package name (e.g. "tar") or npm spec string (e.g. "tar@4.4.4") to check.
     * @returns {boolean} Returns true if package appears to resolve OK, or is available for require().
     */
    static isInstalled(pkgIdent) {
        let localReg = this.getRegistration(pkgIdent);

        if (localReg) {
            return this.isInstalledInPath(localReg.path);
        }

        return false;
    }

    /**
     * Determines whether a valid package appears to be installed in a given directory.
     *
     * @param {string} pkgPath - Path to package's installation directory.
     * @returns {boolean} Returns true if package seems to exist with valid manifest.
     */
    static isInstalledInPath(pkgPath) {
        let pathBbManifest = pkgPath + ButterbotManifest.MANIFEST_REL_PATH;
        return fs.existsSync(pathBbManifest);
    }
}

module.exports = PackageManager;
