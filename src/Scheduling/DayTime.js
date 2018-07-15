/**
 * Expresses a time of day (e.g. 3pm) that can recur on any day.
 */
class DayTime {
    /**
     * Construct new time of day.
     *
     * @param {number} hour - Hour of day (range 0 - 23).
     * @param {number} minute - Minute of hour (range 0 - 59).
     * @param {number} seconds - Second of minute (range 0 - 59).
     */
    constructor(hour, minute, seconds) {
        /**
         * Hour of day (range 0 - 23).
         *
         * @var {number}
         */
        this.hour = hour;
        /**
         * Minute of hour (range 0 - 59).
         *
         * @var {number}
         */
        this.minute = minute;
        /**
         * Second of minute (range 0 - 59).
         *
         * @var {number}
         */
        this.second = seconds;
    }

    /**
     * Converts to time string (HH:MM:SS).
     *
     * @returns {string}
     */
    toString() {
        let zp = (input) => { input = input.toString(); return input.length === 1 ? `0${input}` : input; };
        let parts = [zp(this.hour), zp(this.minute), zp(this.second)];
        return parts.join(':');
    }

    /**
     * Extracts a DayTime from a Moment.js parsed object.
     *
     * @param {moment} moment - The Moment.js parsed object. Must be valid.
     */
    static fromMoment(moment) {
        return new DayTime(moment.hour(), moment.minute(), moment.second());
    }
}

module.exports = DayTime;