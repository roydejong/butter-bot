const Logger = require('../Core/ButterLog').util.getLogger();
const npm = require('npm');
const ButterDb = require('../Core/ButterDb');

/**
 * BPM - Butterbot Package Manager
 * Main utility class for working with butterbot packages /submodules.
 */
class Bpm {
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
            Logger.warn(`SKIP: Not installing package ${pkgName} as it is already installed.`);
            return false;
        }

        Logger.info(`Going to install npm package: ${pkgName}.`);

        return new Promise((resolve, reject) => {
            let npmOptions = {
                loaded: false,
                global: false,
                save: false
            };

            npm.load(npmOptions, (initErr) => {
                if (initErr) {
                    Logger.error(`Could not initialize npm: ${initErr.toString()}`);
                    reject(initErr);
                    return false;
                }

                npm.commands.install([pkgName], (installErr, data) => {
                    if (installErr) {
                        Logger.error(`npm\t\t${installErr.toString()}`);
                        reject(initErr);
                        return false;
                    }

                    Logger.info(`npm package was installed successfully.`);
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

            Logger.info(`Registering as new package.`);
        } else {
            // Package already registerd
            Logger.info(`Updating existing package registration.`);
        }

        // Perform update (either on new stub; or existing pacakge reg)
        let registerValues = {
            registered_at: new Date(),
            lock_name: pkgName
        };

        ButterDb.db
            .get('packages')
            .find({ id: pkgNameNoTag })
            .assign(registerValues)
            .write();

        Logger.info(`✅ OK. The package has been installed and registered to Butter Bot.`);
    }

    /**
     * Safe method for determining whether a package is installed.
     *
     * @param {string} pkgName - Name of the node module to resolve.
     * @returns {boolean} Returns true if package appears to be available.
     */
    static isInstalled(pkgName) {
        try {
            require.resolve(pkgName);
            return true;
        } catch (e) {
            return false;
        }
    }
}

module.exports = Bpm;