const SelfPackage = require('../../package');
const Logger = require('../Core/ButterLog').util.getLogger();
const npm = require('npm');

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
            Logger.warn(`Skip package installation: ${pkgName} is already installed.`);
            return false;
        }

        Logger.info(`Going to install npm package: ${pkgName}.`);

        return new Promise((resolve, reject) => {
            let npmOptions = {
                loaded: false,
                global: false
            };

            npm.load(npmOptions, (initErr) => {
                if (initErr) {
                    Logger.error(`Could not initialize npm: ${initErr.toString()}`);
                    reject(initErr);
                    return false;
                }

                npm.on("log", (msg) => {
                    Logger.log(`npm\t\t${msg}`);
                });

                npm.commands.install([pkgName], (installErr, data) => {
                    if (installErr) {
                        Logger.error(`npm\t\t${installErr.toString()}`);
                        reject(initErr);
                        return false;
                    }

                    Logger.info(`Package was installed.`);
                    resolve(data);
                });
            });
        });
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