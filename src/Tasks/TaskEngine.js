const logger = require('../Core/ButterLog').logger;
const db = require('../Core/ButterDb').db;

/**
 * Main task engine class. Responsible for scheduling
 */
class TaskEngine {
    /**
     * Extracts the next task from the database, i.e. the task that is closest to being executed from the current point in time.
     */
    determineNextTask() {

    }

    /**
     * Schedules the next timer, based on when the task engine is needed next.
     * This will override the previous state, and can be used safely at any time.
     *
     * @param {boolean} firstRun - If true, be more verbose about potential config problems.
     */
    scheduleNext(firstRun) {
        // Ensure previous timeout is cleared
        this.stop();

        // Determine what the next task to execute is
        let nextTask = this.determineNextTask();

        if (!nextTask) {
            // There are no tasks to execute
            if (firstRun) {
                logger.warn('There are zero planned tasks. Butter Bot has no purpose until it receives tasks.');
            }

            // Schedule an infinitely recurring no-op / keep-alive task
            this._timeoutId = setTimeout(() => {
                this.scheduleNext(false);
            }, Number.MAX_SAFE_INTEGER);
        }
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

module.exports = TaskEngine;