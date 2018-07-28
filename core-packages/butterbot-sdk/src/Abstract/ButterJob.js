/**
 * Struct that contains job data for task execution.
 */
class ButterJob {
    /**
     * @param {string} taskName - The identifier for the task to be executed.
     * @param {Object} properties - Key/value hash for properties specific to this task execution.
     */
    constructor(taskName, properties) {
        /**
         * The identifier for the task to be executed.
         *
         * @type {string}
         */
        this.taskName = taskName || "unknown";

        /**
         * Key/value hash for properties specific to this task execution.
         *
         * @type {Object}
         */
        this.properties = properties || { };
    }

    /**
     * Gets whether this job has a non-empty property list.
     *
     * @returns {boolean}
     */
    get hasAnyProps() {
        return !!(this.properties && this.properties.length);
    }

    /**
     * Gets a property value.
     *
     * @param {string} key - Property key.
     * @param {*} defaultValue - Value to return if property value is undefined or falsy. Defaults to NULL if undefined.
     * @return {string|*|null} Property value if set and truthy, or defaultValue, or NULL if neither are set.
     */
    getProp(key, defaultValue) {
        if (typeof defaultValue === "undefined") {
            defaultValue = null;
        }

        if (!this.hasProp(key)) {
            return
        }

        return this.properties[key] || defaultValue;
    }

    /**
     * Gets whether a property with a given `key` has been defined or not.
     *
     * @param {string} key - Property key.
     * @returns {boolean}
     */
    hasProp(key) {
        return typeof this.properties[key] !== "undefined";
    }
}
