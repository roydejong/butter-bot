const expect = require('chai').expect;
const DayTime = require('../src/Scheduling/DayTime');

describe('DayTime struct', () => {
    it('Can construct with basic input', () => {
        let dt = new DayTime(15, 43, 21);

        expect(dt.hour).to.equal(15);
        expect(dt.minute).to.equal(43);
        expect(dt.second).to.equal(21);
    });

    it('Can stringify with zero-padding', () => {
        let dt = new DayTime(5, 4, 3);

        expect(dt.toString()).to.equal("05:04:03");
    });

    it('Can cast from valid Moment.js object', () => {
        let momentObj = require('moment')("15:43:21", "HH:mm:ss");

        expect(momentObj.isValid()).to.equal(true);

        let dt = DayTime.fromMoment(momentObj);

        expect(dt.hour).to.equal(15);
        expect(dt.minute).to.equal(43);
        expect(dt.second).to.equal(21);
    });

    it('Can compare DayTime objects with .equals()', () => {
        let dt1 = new DayTime(1, 2, 3);
        let dt2 = new DayTime(4, 5, 6);
        let dt3 = new DayTime(1, 2, 3);

        expect(dt1.equals(dt1)).to.equal(true);
        expect(dt1.equals(dt2)).to.equal(false);
        expect(dt1.equals(dt3)).to.equal(true);

        expect(dt2.equals(dt1)).to.equal(false);
        expect(dt2.equals(dt2)).to.equal(true);
        expect(dt2.equals(dt3)).to.equal(false);

        expect(dt3.equals(dt1)).to.equal(true);
        expect(dt3.equals(dt2)).to.equal(false);
        expect(dt3.equals(dt3)).to.equal(true);
    });

    it('Can compare DayTime objects with .diff()', () => {
        let dt1 = new DayTime(1, 2, 3);
        let dt2 = new DayTime(2, 3, 4);

        expect(dt1.diff(dt1)).to.equal(0);
        expect(dt1.diff(dt2)).to.equal(-3600 + -60 + -1);
        expect(dt1.diff(dt2, true)).to.equal(Math.abs(-3600 + -60 + -1));
        expect(dt2.diff(dt1)).to.equal(3600 + 60 + 1);
    });

    it('Can compare DayTime objects with .isAfter()', () => {
        let dt1 = new DayTime(1, 2, 3);
        let dt2 = new DayTime(4, 5, 6);
        let dt3 = new DayTime(1, 2, 3);

        expect(dt1.isAfter(dt1)).to.equal(false);
        expect(dt1.isAfter(dt2)).to.equal(false);
        expect(dt1.isAfter(dt3)).to.equal(false);

        expect(dt2.isAfter(dt1)).to.equal(true);
        expect(dt2.isAfter(dt2)).to.equal(false);
        expect(dt2.isAfter(dt3)).to.equal(true);

        expect(dt3.isAfter(dt1)).to.equal(false);
        expect(dt3.isAfter(dt2)).to.equal(false);
        expect(dt3.isAfter(dt3)).to.equal(false);
    });

    it('Can compare DayTime objects with .isBefore()', () => {
        let dt1 = new DayTime(1, 2, 3);
        let dt2 = new DayTime(4, 5, 6);
        let dt3 = new DayTime(1, 2, 3);

        expect(dt1.isBefore(dt1)).to.equal(false);
        expect(dt1.isBefore(dt2)).to.equal(true);
        expect(dt1.isBefore(dt3)).to.equal(false);

        expect(dt2.isBefore(dt1)).to.equal(false);
        expect(dt2.isBefore(dt2)).to.equal(false);
        expect(dt2.isBefore(dt3)).to.equal(false);

        expect(dt3.isBefore(dt1)).to.equal(false);
        expect(dt3.isBefore(dt2)).to.equal(true);
        expect(dt3.isBefore(dt3)).to.equal(false);
    });
});
