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
     * Helper function.
     * Adds all the tasks from a given manifest file (via putTask()).
     *
     * @param {Manifest} manifest - The manifest that holds the task list to process.
     * @see putTask
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

    /**
     * Pulls a task, removing it from the repository.
     *
     * @param {string} taskName - The globally unique identifier for this task.
     * @return {boolean} True if task was found and removed, false if no action was taken.
     */
    static pullTask(taskName) {
        if (typeof this.tasks[taskName] !== "undefined") {
            delete this.tasks[taskName];
            return true;
        }

        return false;
    }
}

// Bootstrap
TaskRepository.clear();

module.exports = TaskRepository;
