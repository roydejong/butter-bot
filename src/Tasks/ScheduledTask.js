const logger = require('../Core/ButterLog').logger;
const objectHash = require('object-hash').MD5;
const Schedule = require('../Scheduling/Schedule');

/**
 * A local instance of a task that has been scheduled to run.
 * Each scheduled task refers to a TaskDefinition that should be available from the TaskRegistry.
 *
 * @see TaskRegistry
 * @see TaskDefinition
 */
class ScheduledTask {
    /**
     *
     * @param {object|null} options - Optional initial values for the Task instance.
     */
    constructor(options) {
        /**
         * The identifier for the task to be executed.
         *
         * @type {null}
         */
        this.taskName = null;

        /**
         * Key/value hash for properties specific to this scheduled task.
         *
         * @type {Object}
         */
        this.properties = {};

        /**
         * Schedule expression.
         * If not set to a valid expression, this task will never run.
         *
         * @type {string|null}
         */
        this.scheduleExpression = null;

        /**
         * Determines the consideration order when scheduling tasks.
         * A lower-numbered priority means the task will get priority over others.
         * Defaults to ScheduledTask.DEFAULT_PRIORITY.
         *
         * @type {number}
         */
        this.priority = ScheduledTask.DEFAULT_PRIORITY;

        // ----- Non-unique properties (not part of disciminator) live below this line ---------------------------------

        /**
         * Raw last run date value.
         * May be set to NULL if this task has not ran before.
         *
         * @type {string|null}
         */
        this.lastRun = null;

        /**
         * Raw last run result value.
         * May be set to NULL if this task has not ran before, or did not return anything explicitly.
         *
         * @type {*|null}
         */
        this.lastRunResult = null;

        if (options) {
            this.fillFromObject(options);
        }
    }

    /**
     * Helper function: Get the Schedule objects for this task.
     *
     * @return {Schedule[]}
     */
    getSchedules() {
        if (!this.scheduleExpression) {
            // No (valid) expression, nothing we can do
            return null;
        }

        if (!this._cachedSchedules || this._cachedScheduleExpression !== this.scheduleExpression) {
            // If the cache is invalid or for a different expression, regenerate it now
            this._cachedSchedules = Schedule.parse(this.scheduleExpression);
            this._cachedScheduleExpression = this.scheduleExpression;
        }

        // Cache has been filled by us, we're good to go
        return this._cachedSchedules;
    }

    /**
     * Deserialize a given options object onto this task instance.
     *
     * @param {Object} options - Key/value object containing task information. See Task.constructor() for specs.
     */
    fillFromObject(options) {
        for (let propName in options) {
            if (options.hasOwnProperty(propName)) {
                if (ScheduledTask.ASSIGNABLE_OPTIONS.indexOf(propName) >= 0) {
                    // Valid property & whitelisted for assignment
                    this[propName] = options[propName];
                } else {
                    // Not whitelisted for assignment (log if not "id" which we ignore silently)
                    if (propName !== "id") {
                        logger.warn(`[task] Violation warning: Not allowed to set property "${propName}" on a task.`);
                    }
                }
            }
        }
    }

    /**
     * Serializes the Task to a minimal object that is database-ready.
     *
     * @return {Object}
     */
    asDatabaseObject() {
        let szObj = { };

        for (let i = 0; i < ScheduledTask.ASSIGNABLE_OPTIONS.length; i++) {
            let propName = ScheduledTask.ASSIGNABLE_OPTIONS[i];

            if (typeof this[propName] !== "undefined" && this[propName]) {
                szObj[propName] = this[propName];
            }
        }

        szObj["id"] = this.discriminator;
        return szObj;
    }

    /**
     * Format and return a unique discriminator to describe this task.
     *
     * @return {string}
     */
    get discriminator() {
        return [
            this.taskName,
            objectHash(this.properties),
            this.scheduleExpression,
            this.priority
        ].join(ScheduledTask.DISCRIMINATOR_SEPARATOR);
    }
}

/**
 * Defines a list of properties that can be magically assigned via the `options` parameter in the constructor.
 * This list is also used for (de)serialization of the task to the database.
 *
 * @type {string[]}
 */
ScheduledTask.ASSIGNABLE_OPTIONS = ["taskName", "properties", "scheduleExpression", "priority", "lastRun",
    "lastRunResult"];

/**
 * Separator token for discriminator string generation.
 *
 * @type {string}
 */
ScheduledTask.DISCRIMINATOR_SEPARATOR = '@';

/**
 * This is the default priority for newly initialized tasks that do not explicitly define one themselves.
 *
 * @type {number}
 */
ScheduledTask.DEFAULT_PRIORITY = 500;

module.exports = ScheduledTask;
