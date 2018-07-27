/**
 * Output struct from the scheduler: tells us WHAT task(s) to execute WHEN.
 */
class SchedulerResult {
    /**
     * @param {ScheduledTask} task - The task to execute.
     * @param {Number} intervalSecs - Schedule time: Interval until this task should be ran, in seconds.
     */
    constructor(task, intervalSecs) {
        /**
         * The list of task(s) to be executed.
         *
         * @type {ScheduledTask}
         */
        this.task = task || null;

        /**
         * The wait time before the tasks should be executed in seconds.
         *
         * @type {Number|number}
         */
        this.intervalSecs = intervalSecs || 0;
    }
}

module.exports = SchedulerResult;
