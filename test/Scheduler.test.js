const expect = require('chai').expect;
const Scheduler = require('../src/Scheduling/Scheduler');
const Schedule = require('../src/Scheduling/Schedule');
const ScheduledTask = require('../src/Tasks/ScheduledTask');
const moment = require('moment');

describe('Scheduler.getQualifyingSchedules()', () => {
    it('Accept tasks with a simple / unconstrained schedule', () => {
        let schedTask = new ScheduledTask({
            "scheduleExpression": "every minute"
        });

        expect(Scheduler.getQualifyingSchedules(schedTask).length).to.equal(1);
    });

    it('Do not accept tasks without a (valid) schedule ', () => {
        let schedTask = new ScheduledTask({
            "scheduleExpression": ""
        });

        expect(Scheduler.getQualifyingSchedules(schedTask).length).to.equal(0);
    });

    it('Do not accept tasks constrained to a day other than today', () => {
        let schedTask = new ScheduledTask({
            "scheduleExpression": "every minute on tomorrow"
        });

        expect(Scheduler.getQualifyingSchedules(schedTask).length).to.equal(0);
    });

    it('Do not accept tasks constrained to a later time', () => {
        expect(Scheduler.getQualifyingSchedules(new ScheduledTask({"scheduleExpression": "today at 11:59:59pm"})).length)
            .to.equal(0);

        expect(Scheduler.getQualifyingSchedules(new ScheduledTask({"scheduleExpression": "today at 00:00:00"})).length)
            .to.equal(1);

        // ok it's not waterproof, maybe don't run tests at midnight or the seconds leading up to it :-)
    });
});

describe('Scheduler.getNextRun()', () => {
    it('Schedules qualifying tasks, that have not yet run, for immediate execution', () => {
        let schedTask = new ScheduledTask({
            "scheduleExpression": "every minute"
        });

        let qualScheds = Scheduler.getQualifyingSchedules(schedTask);

        // Sanity check
        expect(qualScheds.length).to.equal(1);

        // Test
        expect(Scheduler.getNextRun(schedTask, qualScheds).format("LLL"))
            .to.equal(moment().format("LLL"));
    });

    it('Schedules qualifying tasks with intervals correctly (every X)', () => {
        let schedTask = new ScheduledTask({
            "scheduleExpression": "every hour"
        });
        schedTask.lastRun = moment().subtract(1, 'day').toISOString();

        let qualScheds = Scheduler.getQualifyingSchedules(schedTask);

        // Sanity check
        expect(qualScheds.length).to.equal(1);

        // Test
        let expected = moment().subtract(1, 'day').add(1, 'hour').format("LLL");
        let actual = Scheduler.getNextRun(schedTask, qualScheds).format("LLL");

        expect(expected).to.equal(actual);
    });

    it('Schedules qualifying tasks with intervals correctly (every X Y)', () => {
        let schedTask = new ScheduledTask({
            "scheduleExpression": "every 5 weeks"
        });
        schedTask.lastRun = moment().subtract(1, 'day').toISOString();

        let qualScheds = Scheduler.getQualifyingSchedules(schedTask);

        // Sanity check
        expect(qualScheds.length).to.equal(1);

        // Test
        let expected = moment().subtract(1, 'day').add(5, 'weeks').format("LLL");
        let actual = Scheduler.getNextRun(schedTask, qualScheds).format("LLL");

        expect(actual).to.equal(expected);
    });

    it('Schedules tasks with multiple time constraints, that were already run today, correctly', () => {
        let schedEx = "every day at 3pm and at 5pm";
        let schedTask = new ScheduledTask({
            "scheduleExpression": schedEx
        });
        schedTask.lastRun = moment().startOf('day').add(15, 'hours').toISOString(); // today 3pm

        // note: we cannot use the getQualifyingSchedules as this schedule would not qualify normally and we can't
        // really mock the "current" time of day easily here
        let qualScheds = [Schedule.parsePart(schedEx)];

        // Test
        let expected = moment().startOf('day').add(17, 'hours').format("LLL"); // today 5pm
        let actual = Scheduler.getNextRun(schedTask, qualScheds).format("LLL");

        expect(actual).to.equal(expected);
    });

    it('Schedules tasks with a time constraint, that were not already run today, correctly', () => {
        let schedEx = "every day at 3pm";
        let schedTask = new ScheduledTask({
            "scheduleExpression": schedEx
        });
        schedTask.lastRun = moment().subtract(1, 'day').toISOString(); // today midnight

        // note: we cannot use the getQualifyingSchedules as this schedule would not qualify normally and we can't
        // really mock the "current" time of day easily here
        let qualScheds = [Schedule.parsePart(schedEx)];

        // Test
        let expected = moment().startOf('day').add(15, 'hours').format("LLL"); // today 15:00
        let actual = Scheduler.getNextRun(schedTask, qualScheds).format("LLL");

        expect(actual).to.equal(expected);
    });
});
