const logger = require('../Core/ButterLog').logger;
const objectHash = require('object-hash').MD5;

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
         * Schedule information.
         * TBD.
         *
         * @type {null}
         */
        this.schedule = null;

        if (options) {
            this.fillFromObject(options);
        }
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
                    // Not whitelisted for assignment
                    logger.warn(`[task] Violation warning: Not allowed to set property "${propName}" on a task.`);
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
        let szObj = {};

        for (let propName in ScheduledTask.ASSIGNABLE_OPTIONS) {
            if (this.hasOwnProperty(propName) && this[propName]) {
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
            objectHash(this.properties)
        ].join(ScheduledTask.DISCRIMINATOR_SEPARATOR);
    }
}

/**
 * Defines a list of properties that can be magically assigned via the `options` parameter in the constructor.
 * This list is also used for (de)serialization of the task to the database.
 *
 * @type {string[]}
 */
ScheduledTask.ASSIGNABLE_OPTIONS = ["taskName", "properties", "schedule"];

/**
 * Separator token for discriminator string generation.
 *
 * @type {string}
 */
ScheduledTask.DISCRIMINATOR_SEPARATOR = '@';

module.exports = ScheduledTask;