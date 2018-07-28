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

            if (selTask != null && selPriority !== _schedTask.priority && selInterval <= 0) {
                // We already have a task to run on a higher priority, and a lower interval is impossible
                // (Since tasks are pre-sorted we can break out safely here, as we just stepped up)
                logger.debug(`[scheduler-test] Break out: Refusing to step up a priority, selection complete`);
                break;
            }

            // Determine the next execution time
            let nextExec = this.getNextRun(_schedTask, qualifyingSchedules);

            if (nextExec) {
                let intervalForTask = nextExec.diff(moment(), 'seconds');

                if (selInterval >= 0 && (selInterval == null || selInterval > intervalForTask)) {
                    // First matching task, or this interval is closer than our previously selected task
                    selInterval = intervalForTask;
                    selTask = _schedTask;
                    selPriority = _schedTask.priority;
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
        let now = moment();

        let lastRun = moment(scheduledTask.lastRun);
        let lastRunDayTime = DayTime.fromMoment(lastRun);

        if (!lastRun || !lastRun.isValid()) {
            // This task has not been run yet, but it qualifies, so run it now
            return now;
        }

        let wasRunToday = now.format('LL') === lastRun.format('LL');

        let runs = [];

        for (let i = 0; i < qualifyingSchedules.length; i++) {
            let _sched = qualifyingSchedules[i];

            if (_sched.interval > 0) {
                // Task has an interval, compare to last execution and return that as next expected exec.
                // This handles "every X seconds/minutes/hours/days/weeks/months".
                runs.push(lastRun.add(_sched.interval, 'seconds'));
            } else if (_sched.times) {
                // Task needs to be run at some point today, and it has a set time, or multiple times to run at
                // We'll work out what the day time is, and use that for our run time
                let lowestDayTime = null;

                for (let j = 0; j < _sched.times.length; j++) {
                    let _dayTime = _sched.times[j];

                    if (wasRunToday && lastRunDayTime.isOnOrAfter(_dayTime)) {
                    //     already ran today, on or after the time we're evaluating
                        continue;
                    }

                    if (lowestDayTime == null || lowestDayTime.isAfter(_dayTime)) {
                        lowestDayTime = _dayTime;
                    }
                }

                if (lowestDayTime) {
                    runs.push(lowestDayTime.applyToMoment(moment()));
                }
            }
        }

        // Select closest run of any possible candidates
        let lowestNextRun = null;

        for (let i = 0; i < runs.length; i++) {
            let _runMoment = runs[i];

            if (lowestNextRun === null || lowestNextRun.isAfter(_runMoment)) {
                lowestNextRun = _runMoment;
            }
        }

        return lowestNextRun;
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
