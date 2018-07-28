/**
 * Abstract base class for Butter Bot task implementations.
 */
class ButterTask {
    /**
     * Initializes new instance of this Butter Bot task implementation.
     *
     * @param {ButterJob} job - Job data.
     */
    constructor(job) {
        /**
         * Job data.
         *
         * @type {ButterJob}
         */
        this.job = job;
    }

    /**
     * Execute a job.
     *
     * @throws {*} May throw any error, if task execution fails. The job will be marked as failed.
     * @return {*} Anything - will be passed to any subsequent tasks in the chain, and stored with the scheduled task.
     */
    run () {
        throw new Error('ButterTask.run() has not been implemented');
    }
}

module.exports = ButterTask;
