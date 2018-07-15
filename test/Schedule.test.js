const expect = require('chai').expect;
const Schedule = require('../src/Scheduling/Schedule');

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

describe('Schedule expression parser', () => {
    it('Empty expression strings are ignored, and result in an empty array', () => {
        let input = "";
        let output = Schedule.parse(input);

        expect(output).to.be.an('array').that.is.empty;
    });

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

        expect(output.times.length).to.equal(2);
        expect(output.times[0].toString()).to.equal("12:34:00");
        expect(output.times[1].toString()).to.equal("15:00:00");
    });

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

    it('Throws syntax error: "today" cannot be prefixed', () => {
        let input = "every today";

        expect(() => { Schedule.parsePart(input) }).to.throw();
    });

    it('Throws syntax error: "tomorrow" cannot be prefixed', () => {
        let input = "next tomorrow";

        expect(() => { Schedule.parsePart(input) }).to.throw();
    });

    it('Throws syntax error: Cannot have any day token after a time was specified', () => {
        let input = "every wednesday at 15:00 and friday";

        expect(() => { Schedule.parsePart(input) }).to.throw();
    });
});