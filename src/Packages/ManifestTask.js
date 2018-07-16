const path = require('path');

/**
 * Struct that represents a task definition, part of a manifest file.
 */
class ManifestTask {
    /**
     * Construct new manifest task definition.
     *
     * @param {Manifest} manifest - Parent manifest.
     * @param {string} name - Globally unique task name.
     * @param {string} require - Task require path.
     */
    constructor(manifest, name, require) {
        /**
         * Parent manifest.
         *
         * @type {Manifest}
         */
        this.manifest = manifest;

        /**
         * Globally unique task name.
         *
         * @var {string}
         */
        this.taskName = name;

        /**
         * The relative require() path that Butter Bot uses to load the actual task code.
         * This path MUST be relative to the module this task is a part of.
         *
         * @var {string}
         */
        this.requirePath = require;
    }

    /**
     * Returns whether this manifest task item is valid.
     *
     * @return {boolean}
     */
    isValid() {
        if (!this.taskName || !this.requirePath) {
            // Required fields
            return false;
        }

        if (path.isAbsolute(this.requirePath)) {
            // Absolute paths are not permitted
            return false;
        }

        if (this.requirePath.indexOf('..') >= 0) {
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
     *
     * @param {Manifest} manifest - Parent manifest.
     * @param {Object} data
     */
    static fromData(manifest, data) {
        return new ManifestTask(manifest, data.name || "", data.require || "");
    }
}

module.exports = ManifestTask;
