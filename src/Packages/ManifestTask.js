const path = require('path');

/**
 * Struct that represents a task definition, part of a manifest file.
 */
class ManifestTask {
    /**
     * Construct new manifest task definition.
     *
     * @param {string} name - Globally unique task name.
     * @param {string} require - Task require path.
     */
    constructor(name, require) {
        /**
         * Globally unique task name.
         *
         * @var {string}
         */
        this.name = name;

        /**
         * The relative require() path that Butter Bot uses to load the actual task code.
         * This path MUST be relative to the module this task is a part of.
         *
         * @var {string}
         */
        this.require = require;
    }

    /**
     * Returns whether this manifest task item is valid.
     *
     * @return {boolean}
     */
    isValid() {
        if (!this.name || !this.require) {
            // Required fields
            return false;
        }

        if (path.isAbsolute(this.require)) {
            // Absolute paths are not permitted
            return false;
        }

        if (this.require.indexOf('..') >= 0) {
            // Path with traversal characters (../../) are not allowed
            return false;
        }

        return true;
    }

    /**
     * Fills the manifest task item from a data object.
     * Does not guarantee a valid object (use isValid()).
     *
     * @see ManifestTask.isValid
     * @param {Object} data
     */
    static fromData(data) {
        return new ManifestTask(data.name || null, data.require || null);
    }
}

module.exports = ManifestTask;
