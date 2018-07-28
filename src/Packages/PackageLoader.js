const path = require('path');
const Manifest = require('./Manifest');
const logger = require('../Core/ButterLog').logger;
const TaskRepository = require('../Tasks/TaskRepository');

/**
 * Utility for loading tasks and other components provided by packages.
 */
class PackageLoader {
    /**
     * @param {Object[]} dbPkgList - Registration records from tasks from the database.
     * @return {PackageLoaderStats} Stats about what was loaded.
     */
    static loadFromDatabaseList(dbPkgList) {
        let retStats = {
            tasks: 0
        };

        for (let i = 0; i < dbPkgList.length; i++) {
            let _dbPkg = dbPkgList[i];

            try {
                let manifestPath = path.join(_dbPkg.path, Manifest.MANIFEST_REL_PATH);
                let manifest = Manifest.parseFromPath(_dbPkg.id, manifestPath);

                if (!manifest.isValid()) {
                    throw new Error(`The "butterbot.json" manifest file for package ${_dbPkg.id} contains invalid settings.`);
                }

                logger.debug(`[bpm] (load:${_dbPkg.id}) Processing manifest at ${manifestPath}`);

                // Process tasks
                retStats.tasks += TaskRepository.putTasksFromManifest(manifest);
            } catch (e) {
                logger.warn(`[bpm] (load:${_dbPkg.id}) Could not load package: ${e.toString()}`);
            }
        }

        return retStats;
    }
}

/**
 * @typedef {Object} PackageLoaderStats
 * @property {number} tasks - Amount of tasks loaded in to the TaskRepository.
 */


module.exports = PackageLoader;
