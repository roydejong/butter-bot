const expect = require('chai').expect;
const Schedule = require('../src/Scheduling/Schedule');
const DayTime = require('../src/Scheduling/DayTime');

let fnGetWeekDay = (modifier) => {
    let now = new Date();
    let weekDay = now.getDay(); /** Gets the day of the week, using local time. */

    if (modifier && modifier !== -1 && modifier !== +1) {
        throw new Error('fnGetWeekDay() keeps things simple, and only supports +1, 0 or -1');
    }

    weekDay += modifier;

    if (weekDay === -1) {
        weekDay = 6; // day before sunday (0) wraps to saturday (6)
    }

    if (weekDay === 7) {
        weekDay = 0; // day after saturday (6) wraps to sunday (0)
    }

    return weekDay;
};

describe('Schedule struct', () => {
    it('Constructor throws error: Cannot set both "times" and "interval" values', () => {
        expect(() => { new Schedule("every", [0, 1, 2, 3], [new DayTime(15, 43, 21)], 3600) })
            .to.throw('Cannot set both "times" and "interval" for a single schedule item.');
    });
});

describe('Schedule interval calculation', () => {
    it('Calculates intervals correctly: single unit', () => {
        expect(Schedule.calculateInterval(1, "minute")).to.equal(60);
    });

    it('Calculates intervals correctly: multiple units', () => {
        expect(Schedule.calculateInterval(2, "minutes")).to.equal(120);
    });
});

describe('Schedule expression parser', () => {
    it('Empty expression strings are ignored, and result in an empty array', () => {
        let input = "";
        let output = Schedule.parse(input);

        expect(output).to.be.an('array').that.is.empty;
    });


    // ---


    it('Parses prefixed days (every X)', () => {
        let input = "every friday";
        let output = Schedule.parsePart(input);

        expect(output.prefix).to.equal('every');
        expect(output.days).to.deep.equal([5]);
    });

    it('Parses prefixed multiple days (every X and Y)', () => {
        let input = "every friday and saturday";
        let output = Schedule.parsePart(input);

        expect(output.prefix).to.equal('every');
        expect(output.days).to.deep.equal([5, 6]);
    });

    it('Parses prefixed multiple days with a time (every X and Y at Z)', () => {
        let input = "every friday and saturday at 12:34";
        let output = Schedule.parsePart(input);

        expect(output.prefix).to.equal('every');
        expect(output.days).to.deep.equal([5, 6]);
        expect(output.times.length).to.equal(1);
        expect(output.times[0].toString()).to.equal("12:34:00");
    });

    it('Parses prefixed multiple days with multiple times (every X and Y at Z1 and at Z2)', () => {
        let input = "every friday and saturday at 12:34 and at 3pm";
        let output = Schedule.parsePart(input);

        expect(output.days).to.deep.equal([5, 6]);
        expect(output.times.length).to.equal(2);
        expect(output.times[0].toString()).to.equal("12:34:00");
        expect(output.times[1].toString()).to.equal("15:00:00");
    });


    // ---


    it('Parses "today" relative to current time', () => {
        let input = "today";
        let output = Schedule.parsePart(input);

        expect(output.days).to.deep.equal([fnGetWeekDay(+0)]);
    });

    it('Parses "tomorrow" relative to current time', () => {
        let input = "tomorrow";
        let output = Schedule.parsePart(input);

        expect(output.days).to.deep.equal([fnGetWeekDay(+1)]);
    });


    // ---


    it('Interval parser: Parses "every second" format', () => {
        expect(Schedule.parsePart("every second").interval).to.equal(1);
    });

    it('Interval parser: Parses "every minute" format', () => {
        expect(Schedule.parsePart("every minute").interval).to.equal(60);
    });

    it('Interval parser: Parses "every hour" format', () => {
        expect(Schedule.parsePart("every hour").interval).to.equal(3600);
    });

    it('Interval parser: Parses "every day" format', () => {
        expect(Schedule.parsePart("every day").interval).to.equal(86400);
    });

    it('Interval parser: Parses "every week" format', () => {
        expect(Schedule.parsePart("every week").interval).to.equal(604800);
    });

    it('Interval parser: Parses "every month" format', () => {
        expect(Schedule.parsePart("every month").interval).to.equal(2678400); // 31 days // TODO this will break
    });


    // ---


    it('Interval parser: Parses "X seconds" format', () => {
        expect(Schedule.parsePart("every 3 seconds").interval).to.equal(1 * 3);
    });

    it('Interval parser: Parses "X minutes" format', () => {
        expect(Schedule.parsePart("every 3 minutes").interval).to.equal(60 * 3);
    });

    it('Interval parser: Parses "X hours" format', () => {
        expect(Schedule.parsePart("every 3 hours").interval).to.equal(3600 * 3);
    });

    it('Interval parser: Parses "X days" format', () => {
        expect(Schedule.parsePart("every 3 days").interval).to.equal(86400 * 3);
    });

    it('Interval parser: Parses "X weeks" format', () => {
        expect(Schedule.parsePart("every 3 weeks").interval).to.equal(604800 * 3);
    });

    it('Interval parser: Parses "X months" format', () => {
        expect(Schedule.parsePart("every 3 months").interval).to.equal(7948800); // 31 days + 30 days + 31 days // TODO this will break
    });


    // ---


    it('Interval parser: Can combine intervals with (multiple) days using "on" (every X Y on Z1 and Z2)', () => {
        let input = "every 5 minutes on friday and saturday";
        let output = Schedule.parsePart(input);

        expect(output.days).to.deep.equal([5, 6]);
        expect(output.interval).to.equal(60 * 5);
    });

    it('Interval parser: Can combine single-intervals with (multiple) days using "on" (every X on Y1 and Y2)', () => {
        let input = "every minute on friday and saturday";
        let output = Schedule.parsePart(input);

        expect(output.days).to.deep.equal([5, 6]);
        expect(output.interval).to.equal(60 * 1);
    });


    // ---


    it('Time parser: Parses HH:mm format', () => {
        expect(Schedule.parsePart("at 12:34").times[0].toString()).to.equal("12:34:00");
    });

    it('Time parser: Parses HH:mm:ss format', () => {
        expect(Schedule.parsePart("at 12:34:21").times[0].toString()).to.equal("12:34:21");
    });

    it('Time parser: Parses h:mma format', () => {
        expect(Schedule.parsePart("at 12:34pm").times[0].toString()).to.equal("12:34:00");
    });

    it('Time parser: Parses h:mm:ssa format', () => {
        expect(Schedule.parsePart("at 12:34:21pm").times[0].toString()).to.equal("12:34:21");
    });

    it('Time parser: Parses ha format', () => {
        expect(Schedule.parsePart("at 12pm").times[0].toString()).to.equal("12:00:00");
    });


    // ---


    it('Throws syntax error: Invalid first token', () => {
        let input = "invalid";

        expect(() => { Schedule.parsePart(input) }).to.throw();
    });

    it('Throws syntax error: Invalid token after valid tokens', () => {
        let input = "every monday invalid";

        expect(() => { Schedule.parsePart(input) }).to.throw();
    });

    it('Throws syntax error: Day token without "and"', () => {
        let input = "every monday friday";

        expect(() => { Schedule.parsePart(input) }).to.throw();
    });

    it('Throws syntax error: Orphaned first token', () => {
        let input = "this";

        expect(() => { Schedule.parsePart(input) }).to.throw();
    });

    it('Throws syntax error: "today" cannot be prefixed (if no interval)', () => {
        expect(() => { Schedule.parsePart("every today") }).to.throw();
        expect(() => { Schedule.parsePart("every 5 minutes on today") }).to.not.throw();
    });

    it('Throws syntax error: "tomorrow" cannot be prefixed (if no interval)', () => {
        expect(() => { Schedule.parsePart("every tomorrow") }).to.throw();
        expect(() => { Schedule.parsePart("every 5 minutes on tomorrow") }).to.not.throw();
    });

    it('Throws syntax error: Cannot have any day token after a time was specified', () => {
        let input = "every wednesday at 15:00 and friday";

        expect(() => { Schedule.parsePart(input) }).to.throw();
    });

    it('Throws syntax error: Cannot use numbers after "every" except with an interval unit', () => {
        let input = "every 1 monday";

        expect(() => { Schedule.parsePart(input) }).to.throw("expected a unit");
    });
});
