const ButterJob = require('butterbot-sdk').ButterJob;
const TaskRepository = require('./TaskRepository');

/**
 * Job runner / executor.
 */
class JobRunner {
    /**
     * Executes a given Scheduled Task.
     *
     * @throws {*} Any configuration problems or runtime errors will result in an error being thrown.
     * @param {ScheduledTask} scheduledTask
     * @returns {Promise<*>}
     */
    static run(scheduledTask) {
        return new Promise((resolve) => {
            // Task name
            let taskName = scheduledTask.taskName;

            if (!taskName) {
                throw new Error(`Cannot run job because no (valid) task name is set.`)
            }

            // Task def
            let manifestTaskData = TaskRepository.getTask(taskName);

            if (!manifestTaskData) {
                throw new Error(`Cannot run job because the referenced task ("${taskName}") is not recognized. Is the package that contains this task installed and registered correctly?`);
            }

            let manifest = manifestTaskData.manifest;
            let packageName = manifest.packageName;

            let manifestTask = manifestTaskData.manifestTask;

            if (!manifestTask.isValid()) {
                throw new Error(`Cannot run job because the manifest task for "${taskName}" is invalid. The maintainer of the package ("${packageName}") needs to fix this.`);
            }

            // Load & run
            let requirePath = packageName + "/" + manifestTask.requirePath;
            let LoadedTaskClass = null;

            try {
                LoadedTaskClass = require(requirePath);
            } catch (e) {
                throw new Error(`Unable to load task "${taskName}" with require("${requirePath}"): ${e.message || "Unknown error"}`)
            }

            console.log(LoadedTaskClass);

            // Initialize job struct (from sdk corepackage), initialize a task instance with it
            let job = new ButterJob(taskName, scheduledTask.properties);
            let taskInstance = new LoadedTaskClass(job);

            // Run code, resolve promise with return value
            resolve(taskInstance.run());
        });
    }
}

module.exports = JobRunner;
