const expect = require('chai').expect;
const Scheduler = require('../src/Scheduling/Scheduler');
const ScheduledTask = require('../src/Tasks/ScheduledTask');

describe('Scheduler', () => {
    it('isRunnable(): Accept tasks with a simple / unconstrained schedule', () => {
        let schedTask = new ScheduledTask({
            "scheduleExpression": "every minute"
        });

        expect(Scheduler.getQualifyingSchedules(schedTask).length).to.equal(1);
    });

    it('isRunnable(): Do not accept tasks without a (valid) schedule ', () => {
        let schedTask = new ScheduledTask({
            "scheduleExpression": ""
        });

        expect(Scheduler.getQualifyingSchedules(schedTask).length).to.equal(0);
    });

    it('isRunnable(): Do not accept tasks constrained to a day other than today', () => {
        let schedTask = new ScheduledTask({
            "scheduleExpression": "every minute on tomorrow"
        });

        expect(Scheduler.getQualifyingSchedules(schedTask).length).to.equal(0);
    });

    it('isRunnable(): Do not accept tasks constrained to a later time', () => {
        expect(Scheduler.getQualifyingSchedules(new ScheduledTask({"scheduleExpression": "today at 11:59:59pm"})).length)
            .to.equal(0);

        expect(Scheduler.getQualifyingSchedules(new ScheduledTask({"scheduleExpression": "today at 00:00:00"})).length)
            .to.equal(1);

        // ok it's not waterproof, maybe don't run tests at midnight or the seconds leading up to it :-)
    });
});
