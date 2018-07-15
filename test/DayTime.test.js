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
});