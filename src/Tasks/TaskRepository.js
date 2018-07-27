const logger = require('../Core/ButterLog').logger;

/**
 * Static, shared repository for all tasks that have been loaded.
 */
class TaskRepository {
    /**
     * Initializes or resets the TaskRepository.
     */
    static clear() {
        this.tasks = { };
    }

    /**
     * Helper function: Fetch task by its name safely.
     *
     * @param taskName
     * @returns {ManifestTask|null} Task definition, or NULL if not found.
     */
    static getTask(taskName) {
        return this.tasks[taskName] || null;
    }

    /**
     * Helper function.
     * Adds all the tasks from a given manifest file (via putTask()).
     *
     * @see putTask
     *
     * @param {Manifest} manifest - The manifest that holds the task list to process.
     * @return {Number} Total amount of tasks processed.
     */
    static putTasksFromManifest(manifest) {
        let counter = 0;

        if (manifest.tasks) {
            for (let i = 0; i < manifest.tasks.length; i++) {
                let _manifestTask = manifest.tasks[i];

                logger.debug(`[task-repo] Loading manifest task: ${JSON.stringify(_manifestTask)}`);

                TaskRepository.putTask(manifest, _manifestTask);
                counter++;
            }
        }

        return counter;
    }

    /**
     * Add a task to the repository, or replace it if it already exists.
     *
     * @param {Manifest} manifest - The package manifest.
     * @param {ManifestTask} manifestTask - The specific task in the manifest to process.
     */
    static putTask(manifest, manifestTask) {
        let taskName = manifestTask.taskName;

        if (typeof this.tasks[taskName] !== "undefined") {
            // Warn user that this task is already in the repo, this is usually not good
            logger.warn(`[tasks:${taskName}] Duplicate task name detected in your installed packages (task names must be globally unique).`);
        }

        this.tasks[taskName] = {
            "manifest": manifest,
            "manifestTask": manifestTask
        };
    }
}
TaskRepository.clear(); // Bootstrap on module load

module.exports = TaskRepository;
