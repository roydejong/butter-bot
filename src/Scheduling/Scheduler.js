const DayTime = require('./DayTime');
const SchedulerResult = require('./SchedulerResult');
const logger = require('../Core/ButterLog').logger;
const moment = require('moment');

/**
 * Master scheduler: evaluates tasks and when they should be run next.
 */
class Scheduler {
    /**
     * @param {ScheduledTask[]} scheduledTasks - Collection of scheduled tasks, MUST BE ALREADY SORTED BY PRIORITY.
     * @return {SchedulerResult|null}
     */
    static determineNextTask(scheduledTasks) {
        logger.debug('[scheduler-test] --- Start ---');
        logger.debug(`[scheduler-test] Set of ${scheduledTasks.length} task(s) passed.`);

        let selTask = null;
        let selInterval = null;
        let selPriority = null;

        for (let i = 0; i < scheduledTasks.length; i++) {
            let _schedTask = scheduledTasks[i];
            let qualifyingSchedules = this.getQualifyingSchedules(_schedTask);

            if (!qualifyingSchedules.length) {
                // Task cannot be executed (at all, or today) due to basic scheduling constraint (syntax/day/time)
                logger.debug(`[scheduler-test] No-run: ${_schedTask.discriminator} [basic constraint/no qualifying schedules]`);
                continue;
            }

            if (selTask != null  && selPriority !== _schedTask.priority) {
                // We already have a task to run on a higher priority
                // (Since tasks are pre-sorted we can break out safely here, as we just stepped up)
                logger.debug(`[scheduler-test] Break out: Refusing to step up a priority, selection complete`);
                break;
            }

            // Determine the next execution time
            let nextExec = this.getNextRun(_schedTask, qualifyingSchedules);

            if (nextExec) {
                let intervalForTask = moment().diff(nextExec, 'seconds');

                if (selInterval == null || selInterval > intervalForTask) {
                    // First matching task, or this interval is closer than our previously selected task
                    selInterval = intervalForTask;
                    selTask = _schedTask;
                } else {
                    logger.debug(`[scheduler-test] No-run: ${_schedTask.discriminator} [other task is closer]`);
                }
            } else {
                logger.debug(`[scheduler-test] No-run: ${_schedTask.discriminator} [no next run/schedule constraint]`);
            }
        }

        if (selTask) {
            logger.debug(`[scheduler-test] **** END RESULT: Run task ${selTask.discriminator} (Interval: ${selInterval} secs) ***`);
            return new SchedulerResult(selTask, selInterval);
        }

        logger.debug('[scheduler-test] *** END RESULT: Nothing to execute ***');
        return null;
    }

    static getNextRun(scheduledTask, qualifyingSchedules) {
        let lastRun = moment(scheduledTask.lastRun);

        if (!lastRun || !lastRun.isValid()) {
            // This task has not been run yet, but it qualifies, so run it now
            return moment();
        }

        for (let i = 0; i < qualifyingSchedules.length; i++) {
            let _sched = qualifyingSchedules[i];
        }

        return null;
    }

    /**
     * Given a scheduled task, determine if it is runnable at this time (this task, on this day and time).
     * This method is used to filter out any task that will never qualify due to its constraints.
     *
     * @param {ScheduledTask} scheduledTask
     */
    static getQualifyingSchedules(scheduledTask) {
        let taskSchedules = scheduledTask.getSchedules();

        if (!taskSchedules) {
            // There are no (valid) schedules at all
            return [];
        }

        let qualifyingSchedules = [];

        for (let i = 0; i < taskSchedules.length; i++) {
            let _sched = taskSchedules[i];

            if (!_sched) {
                // Invalid schedule
                continue;
            }

            if (_sched.days && _sched.days.length) {
                // There is a day constraint: check that we are operating on acceptable day
                let currentWeekDay = new Date().getDay();

                if (_sched.days.indexOf(currentWeekDay) === -1) {
                    // Invalid day of the week
                    continue;
                }
            }

            if (_sched.times && _sched.times.length) {
                let now = DayTime.now();
                let anyQualifyingTimes = false;

                // There is a time constraint, ensure that we are running AFTER one of these times and not before
                for (let i = 0; i < _sched.times.length; i++) {
                    let _time = _sched.times[i];

                    if (now.isBefore(_time)) {
                        // We have not yet reached minimum time-of-day to execute
                        // This doesn't qualify :-(
                    } else {
                        anyQualifyingTimes = true;
                    }
                }

                if (!anyQualifyingTimes) {
                    continue;
                }
            }

            // No objections - it must qualify
            qualifyingSchedules.push(_sched);
        }

        // Done
        return qualifyingSchedules;
    }
}

module.exports = Scheduler;
