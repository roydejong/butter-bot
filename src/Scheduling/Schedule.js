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
     */
    constructor(prefix, days, times) {
        this.prefix = prefix;
        this.days = (days && days.length && days) || null;
        this.times = (times && times.length && times) || null;
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
        let sDidReadTime = false;       // -- Indicates whether a time string was read, used for syntax validation.

        let dPrefix = Schedule.T_PREFIX_THIS;
        let dDayNums = [];
        let dDayTimes = [];

        // Iterate and tokenize sub-parts one by one
        for (let i = 0; i < parts.length; i++) {
            let _nextPart = parts[i];
            let sReadingInitial = (i === 0);

            if (sReadingInitial) {
                // Each part of an expression **MAY** start with a prefix.
                // (This is also the only location a prefix should be placed.)
                if (Schedule.T_PREFIXES.indexOf(_nextPart) >= 0) {
                    dPrefix = _nextPart;

                    sDidReadPrefix = true;
                    sExpectingDays = true;
                    sExpectingAnd = false;
                    sExpectingTime = false;
                    sExpectingAt = false;
                    continue;
                }
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

                sExpectingDays = false;
                sExpectingAnd = true;
                sExpectingTime = false;
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
                    sExpectingDays = false;
                    sExpectingAnd = true;
                    sExpectingTime = false;
                    sExpectingAt = false;
                    continue;
                }
            }

            // Token detect: day connector AND
            if (sExpectingAnd && _nextPart === Schedule.T_AND) {
                sExpectingDays = (!sDidReadTime); // "and <day>" is only allowed if we did not yet read a time
                sExpectingAnd = false;
                sExpectingTime = false;
                sExpectingAt = true; // "and at" bridges are allowed
                continue;
            }

            // Token connect: day <-> time connector AT
            if (sExpectingAt && _nextPart === Schedule.T_AT) {
                sExpectingDays = false;
                sExpectingAnd = false;
                sExpectingTime = true;
                sExpectingAt = false;
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

        if (sDidReadPrefix && !dDayNums.length) {
            throw new Error(`Could not parse schedule expression: Not enough input: "${partialExpression}"`);
        }

        return new Schedule(dPrefix, dDayNums, dDayTimes);
    }

}

Schedule.T_PREFIX_EVERY = "every";
Schedule.T_PREFIX_THIS = "this";
Schedule.T_PREFIXES = [Schedule.T_PREFIX_EVERY, Schedule.T_PREFIX_THIS];

Schedule.T_DAY_WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
Schedule.T_DAY_TODAY = "today";
Schedule.T_DAY_TOMORROW = "tomorrow";
Schedule.T_DAYS = Schedule.T_DAY_WEEKDAYS.concat([Schedule.T_DAY_TODAY, Schedule.T_DAY_TOMORROW]);

Schedule.T_AND = "and";
Schedule.T_AT = "at";

Schedule.T_TIME_FORMATS = ["HH:mm:ss", "HH:mm", "h:mm:ssa", "h:mma", "ha"];

module.exports = Schedule;