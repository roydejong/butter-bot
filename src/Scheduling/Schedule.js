const moment = require('moment');
const DayTime = require('./DayTime');

/**
 *
 */
class Schedule {
    /**
     * Initialize a new schedule item, usually after parsing an expression syntax.
     *
     * @see Schedule.parse
     * @see Schedule.parsePart
     *
     * @param {string} prefix - The prefix indicates when the task is executed, and whether it repeats or not.
     *                          See Schedule.T_PREFIXES for possible values.
     *
     * @param {?number[]} days - A list of weekdays numbers that this task should run on.
     *                           Numeric range: 0 - 6 (Sunday - Saturday).
     *                           If set (list of days): task MUST run on these days, and MAY NOT run on any other days.
     *                           If unset (NULL): task MAY run ANY DAY.
     *
     * @param {?number[]} times - A list of DayTimes that indicates at what time this task should run on each day.
     *                            If set (list of day times): task MUST TRY to run on or close to these times.
     *                            If unset (NULL): task MAY run ANY TIME OF DAY.
     *                            Cannot be combined with `interval` value right now.
     *
     * @param {?number} interval - An interval in seconds, if such an interval is provided.
     *                             This is used for recurring tasks, e.g. "every minute" task would have a value of 60.
     *                             Cannot be combined with `times` values right now.
     */
    constructor(prefix, days, times, interval) {
        this.prefix = prefix;
        this.days = (days && days.length && days) || null;
        this.times = (times && times.length && times) || null;
        this.interval = interval || null;

        if (this.times && this.times.length && this.interval > 0) {
            throw new Error('Cannot set both "times" and "interval" for a single schedule item.');
        }
    }

    /**
     * Parses a schedule expression into Schedule items.
     *
     * @param {string} expression - The schedule expression to parse. May be one or more parts.
     * @return {Schedule[]} Returns a list of Schedule items parsed from the expression.
     */
    static parse(expression) {
        let parts = expression.split(',');
        let parsedParts = [];

        for (let i = 0; i < parts.length; i++) {
            let partEx = parts[i];
            let partExParsed = this.parsePart(partEx);

            if (partExParsed != null) {
                parsedParts.push(partEx);
            }
        }

        return parsedParts;
    }

    static parsePart(partialExpression) {
        // Clean partial expression
        partialExpression = partialExpression.toLowerCase();
        partialExpression = partialExpression.trim();

        if (!partialExpression) {
            return null;
        }

        // Split the part into sub-parts, spaces act as a separator for everything
        let parts = partialExpression.split(' ');

        // Tokenizer data & states
        let sDidReadPrefix = false;     // -- Indicates whether a `prefix` was read, used for syntax validation.
        let sExpectingDays = true;      // -- Indicates whether a T_DAYS token is legal next.
        let sExpectingAnd = false;      // -- Indicates whether a T_AND token is legal next.
        let sExpectingTime = true;      // -- Indicates whether a time string is legal next.
        let sExpectingAt = true;        // -- Indicates whether a T_AT token is legal next.
        let sExpectingOn = true;        // -- Indicates whether a T_ON token is legal next.
        let sDidReadTime = false;       // -- Indicates whether a time string was read, used for syntax validation.
        let sExpectingInterval = false; // -- Indicates whether an interval expression (every X Y) is legal next.
        let sReadingIntervalPart = false; // -- Indicates whether we just read an interval value, and are now expecting a unit name.

        let dPrefix = Schedule.T_PREFIX_THIS;
        let dDayNums = [];
        let dDayTimes = [];
        let dIntervalNumber = null;
        let dIntervalValue = 0;

        let fnExpectNothing = () => {
            sExpectingInterval = false;
            sExpectingAt = false;
            sExpectingTime = false;
            sExpectingAnd = false;
            sExpectingDays = false;
            sExpectingOn = false;
        };

        // Iterate and tokenize sub-parts one by one
        for (let i = 0; i < parts.length; i++) {
            let _nextPart = parts[i];
            let sReadingInitial = (i === 0);

            if (sReadingInitial) {
                // Each part of an expression **MAY** start with a prefix.
                // (This is also the only location a prefix should be placed.)
                if (Schedule.T_PREFIXES.indexOf(_nextPart) >= 0) {
                    dPrefix = _nextPart;

                    fnExpectNothing();
                    sDidReadPrefix = true;
                    sExpectingDays = true;
                    sExpectingInterval = (dPrefix === Schedule.T_PREFIX_EVERY);
                    continue;
                }
            }

            // Token detect: interval number (e.g. "every 5 minutes")
            if (sExpectingInterval) {
                if (Schedule.T_INTERVAL_NAMES_WITH_NO_VALUE.indexOf(_nextPart) >= 0) {
                    // A no-value interval was specified (e.g. "every second", "every week", etc).
                    dIntervalNumber = null;
                    dIntervalValue = Schedule.calculateInterval(1, _nextPart); // 1 <unit>

                    fnExpectNothing();
                    continue;
                }

                // Check if it's an number value, which could be start of "<value> <unit>" expression, e.g. "2 hours"
                let asFloat = parseFloat(_nextPart) || parseInt(_nextPart) || NaN;

                if (!isNaN(asFloat) && asFloat > 0) {
                    dIntervalNumber = asFloat;

                    fnExpectNothing();
                    sReadingIntervalPart = true;
                    continue;
                }
            }

            // Interval partial read: read the unit name after reading an interval number
            if (sReadingIntervalPart) {
                if (Schedule.T_INTERVAL_NAMES_WITH_VALUE.indexOf(_nextPart) >= 0) {
                    // A valued interval was specified (e.g. "every 5 seconds", "every 3 weeks", etc).
                    dIntervalValue = Schedule.calculateInterval(dIntervalNumber, _nextPart); // 1 <unit>

                    fnExpectNothing();
                    sReadingIntervalPart = false;
                    sExpectingOn = true; // allow "every X Y on Z1 and Z2" type bridges (interval -> day)
                    continue;
                }

                throw new Error(`Could not parse schedule expression: Got "${_nextPart}" but expected a unit (e.g. seconds, hours, days) to follow number ${dIntervalNumber}.`);
            }

            // Token detect: day names
            if (sExpectingDays && Schedule.T_DAYS.indexOf(_nextPart) >= 0) {
                // Week days
                let idxWeekDay = Schedule.T_DAY_WEEKDAYS.indexOf(_nextPart);
                if (idxWeekDay >= 0) {
                    dDayNums.push(idxWeekDay); // array indexes are ordered the same as JS weekdays (0 = sunday, etc)
                }

                // Special tokens
                if (_nextPart === Schedule.T_DAY_TODAY) {
                    if (sDidReadPrefix) {
                        throw new Error(`Could not parse schedule expression: Cannot combine "${_nextPart}" with a prefix (${dPrefix}).`);
                    }

                    // Today => evaluated at time of parsing
                    let today = new Date().getDay();
                    dDayNums.push(today);
                } else if (_nextPart === Schedule.T_DAY_TOMORROW) {
                    if (sDidReadPrefix) {
                        throw new Error(`Could not parse schedule expression: Cannot combine "${_nextPart}" with a prefix (${dPrefix}).`);
                    }

                    // Tomorrow => evaluated at time of parsing
                    let tomorrow = new Date().getDay() + 1;
                    if (tomorrow === 7) tomorrow = 0;
                    dDayNums.push(tomorrow);
                }

                fnExpectNothing();
                sExpectingAnd = true;
                sExpectingAt = true;
                continue;
            }

            // Token detect: time strings
            if (sExpectingTime) {
                /** @see https://momentjs.com/docs/#/parsing/string-formats/ **/
                let timeParsed = moment(_nextPart, Schedule.T_TIME_FORMATS, true);

                if (timeParsed.isValid()) {
                    // Looks like something in a time format we support and understand
                    dDayTimes.push(DayTime.fromMoment(timeParsed));

                    sDidReadTime = true;

                    fnExpectNothing();
                    sExpectingAnd = true;
                    continue;
                }
            }

            // Token detect: day connector AND
            if (sExpectingAnd && _nextPart === Schedule.T_AND) {
                fnExpectNothing();
                sExpectingDays = (!sDidReadTime); // "and <day>" is only allowed if we did not yet read a time
                sExpectingAt = true; // "and at" bridges are allowed
                continue;
            }

            // Token connect: day <-> time connector AT
            if (sExpectingAt && _nextPart === Schedule.T_AT) {
                fnExpectNothing();
                sExpectingTime = true;
                continue;
            }

            // Token connect: interval <-> day(s) connector ON
            if (sExpectingOn && _nextPart === Schedule.T_ON) {
                fnExpectNothing();
                sExpectingDays = true;
                continue;
            }

            // We are still here (no statement was reached that called "continue"). This means we did not understand
            // the token in `_nextPart`. We'll try to throw a useful syntax error.
            if (sReadingInitial) {
                throw new Error(`Could not parse schedule expression: Unrecognized or unexpected token: "${_nextPart}".`
                    + `\r\nAn expression part must start with a PREFIX, DAY or TIME.`);
            }

            throw new Error(`Could not parse schedule expression: Unrecognized or unexpected token: "${_nextPart}".`);
        }

        if (sDidReadPrefix && !dDayNums.length && !dDayTimes.length && !dIntervalValue) {
            throw new Error(`Could not parse schedule expression: Not enough input to generate a schedule: "${partialExpression}"`);
        }

        return new Schedule(dPrefix, dDayNums, dDayTimes, dIntervalValue);
    }

    /**
     * Utility for calculating an interval.
     *
     * @param {number} value - The amount of the interval (e.g. "1" if the unit is "hours" for "1 hour").
     * @param {string} unitName - The unit name of the interval (e.g. "days" if the value is 3 for "3 days").
     * @returns {number}
     */
    static calculateInterval(value, unitName) {
        // We'll run the modification on Moment.js and calculate the generated offset from today's date
        let now = moment();
        let modified = moment(now).add(value, unitName);

        return Math.abs(now.diff(modified, 'seconds'));
    }
}

Schedule.T_AND = "and";
Schedule.T_AT = "at";
Schedule.T_ON = "on";

Schedule.T_PREFIX_EVERY = "every";
Schedule.T_PREFIX_THIS = "this";
Schedule.T_PREFIXES = [Schedule.T_PREFIX_EVERY, Schedule.T_PREFIX_THIS];

Schedule.T_DAY_WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
Schedule.T_DAY_TODAY = "today";
Schedule.T_DAY_TOMORROW = "tomorrow";
Schedule.T_DAYS = Schedule.T_DAY_WEEKDAYS.concat([Schedule.T_DAY_TODAY, Schedule.T_DAY_TOMORROW]);

Schedule.T_TIME_FORMATS = ["HH:mm:ss", "HH:mm", "h:mm:ssa", "h:mma", "ha"];

Schedule.T_INTERVAL_SECONDS = "seconds";
Schedule.T_INTERVAL_MINUTES = "minutes";
Schedule.T_INTERVAL_HOURS = "hours";
Schedule.T_INTERVAL_DAYS = "days";
Schedule.T_INTERVAL_WEEKS = "weeks";
Schedule.T_INTERVAL_MONTHS = "months";
Schedule.T_INTERVAL_NAMES_WITH_VALUE = [Schedule.T_INTERVAL_SECONDS, Schedule.T_INTERVAL_MINUTES,
    Schedule.T_INTERVAL_HOURS, Schedule.T_INTERVAL_DAYS, Schedule.T_INTERVAL_WEEKS, Schedule.T_INTERVAL_MONTHS];

Schedule.T_INTERVAL_SECOND = "second";
Schedule.T_INTERVAL_MINUTE = "minute";
Schedule.T_INTERVAL_HOUR = "hour";
Schedule.T_INTERVAL_DAY = "day";
Schedule.T_INTERVAL_WEEK = "week";
Schedule.T_INTERVAL_MONTH = "month";
Schedule.T_INTERVAL_NAMES_WITH_NO_VALUE = [Schedule.T_INTERVAL_SECOND, Schedule.T_INTERVAL_MINUTE,
    Schedule.T_INTERVAL_HOUR, Schedule.T_INTERVAL_DAY, Schedule.T_INTERVAL_WEEK, Schedule.T_INTERVAL_MONTH];

module.exports = Schedule;