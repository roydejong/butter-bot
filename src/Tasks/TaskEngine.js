const logger = require('../Core/ButterLog').logger;
const db = require('../Core/ButterDb').db;
const ScheduledTask = require('./ScheduledTask');
const Scheduler = require('../Scheduling/Scheduler');
const JobRunner = require('./JobRunner');

/**
 * Main task engine class. Responsible for scheduling
 */
class TaskEngine {
    /**
     * Reloads the list of scheduled tasks.
     *
     * @param {boolean} doLog - If true, enable logging for loaded tasks.
     * @param {boolean} doRebuild - If true, rebuild the task database.
     */
    reload(doLog, doRebuild) {
        let dbTasks = db
            .get('tasks')
            .value() || [];

        let schTasks = { };

        for (let i = 0; i < dbTasks.length; i++) {
            let _dbTask = dbTasks[i];

            // Load raw data into ScheduledTask struct
            let schTask = new ScheduledTask(_dbTask);

            // Place in struct with discrim keys to eliminate any dupes
            let expectedDiscrim = schTask.discriminator;
            schTasks[expectedDiscrim] = schTask;
        }

        // Rewrite / upgrade the database. Ensures dupes are gone, garbage is thrown out, and structure is up to date.
        if (doRebuild) {
            let newDbTasks = [];

            for (let key in schTasks) {
                if (schTasks.hasOwnProperty(key)) {
                    newDbTasks.push(schTasks[key].asDatabaseObject());
                }
            }

            db.set('tasks', newDbTasks).write();

            logger.debug(`[tasks] Rewrote tasks database (${newDbTasks.length} item(s)).`);
        }

        // Sort by priority (ascending, lower number = execute first)
        this.scheduledTasks = Object.values(schTasks);

        let taskCount = this.scheduledTasks.length;

        this.scheduledTasks.sort((a, b) => {
            if (a.priority < b.priority) return -1;
            if (a.priority > b.priority) return +1;
            return 0;
        });

        if (doLog && taskCount > 0) {
            logger.info(`[tasks] There are ${taskCount} scheduled task(s).`);
        }
    }

    /**
     * Extracts the next task from the database, i.e. the task that is closest to being executed from the current point in time.
     *
     * @return {SchedulerResult}
     */
    scheduleNext() {
        return Scheduler.determineNextTask(this.scheduledTasks);
    }

    /**
     * Schedules the next timer, based on when the task engine is needed next.
     * This will override the previous state, and can be used safely at any time.
     *
     * @param {boolean} firstRun - If true, be more verbose about potential config problems.
     */
    loop(firstRun) {
        // Ensure previous timeout is cleared
        this.stop();

        // Determine what the next task to execute is
        let scheduleResult = this.scheduleNext();

        if (!scheduleResult) {
            // There are no tasks to execute
            if (firstRun) {
                if (!this.scheduledTasks || !this.scheduledTasks.length) {
                    logger.warn('[tasks] No tasks have been scheduled. Nothing to do.');
                } else {
                    logger.warn('[tasks] The scheduler could not determine any tasks to execute. Nothing to do.');
                }
            }

            // Schedule an infinitely recurring no-op / keep-alive task
            this._timeoutId = setTimeout(() => {
                this.loop(false);
            }, TaskEngine.IDLE_RECHECK_INTERVAL);

            return;
        }

        this._timeoutId = setTimeout(() => {
            // Run the task
            let scheduledTask = scheduleResult.task;

            logger.info(`[tasks] (${scheduledTask.discriminator}) Executing task.`);

            JobRunner.run(scheduledTask)
                .then((result) => {
                    logger.info(`[tasks] (${scheduledTask.discriminator}) -> Job done.`);

                    try {
                        let resultJson = JSON.stringify(result);
                        logger.debug(`[tasks] (${scheduledTask.discriminator}) -> Run result: ${resultJson}`);
                    } catch (e) {
                        // "circular json structure" stuff, probably. not something we can serialize
                        logger.debug(`[tasks] (${scheduledTask.discriminator}) -> Run result unavailable (${e.message}, ${result})`);
                        result = null;
                    }

                    this.updateLastRun(scheduledTask, true, result);
                    this.loop(false);
                })
                .catch((err) => {
                    logger.error(`[tasks] (${scheduledTask.discriminator}) -> Job run error: ${err.toString()}`);

                    this.updateLastRun(scheduledTask, false, undefined);
                    this.loop(false);
                });
        }, scheduleResult.intervalSecs * 1000);
    }

    updateLastRun(scheduledTask, wasOk, runResult) {
        let id = scheduledTask.discriminator;

        let dbTask = db
            .get('tasks')
            .find({ id: id })
            .value();

        if (!dbTask) {
            logger.warn(`[tasks] (${scheduledTask.discriminator}) Could not update task in database: record appears to be missing. The database was likely changed after the bot started and is out-of-sync. Forcing reload now.`);
            this.reload(true, true);
            return;
        }

        db
            .get('tasks')
            .find({ id: id })
            .assign({
                lastRun: new Date(),
                lastRunResult: runResult
            })
            .write();

        // TODO Review if reloading is a good idea. The answer is probably NO.
        // For now we do this so lastRun values are updated.
        this.reload(false, false);
    }

    /**
     * Stops the TaskEngine by suspending / clearing the current timeout.
     *
     * @returns {boolean} True if timer was stopped, false if no change (already stopped).
     */
    stop() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
            return true;
        }

        return false;
    }
}

TaskEngine.IDLE_RECHECK_INTERVAL = 60 * 1000;

module.exports = TaskEngine;
