const fs = require('fs');
const ManifestTask = require('./ManifestTask');

/**
 * Represents data from Butter Bot manifest files, and provides utilities for reading and parsing them.
 */
class Manifest {
    /**
     * Construct new, blank manifest data.
     *
     * @param {string} packageName
     */
    constructor(packageName) {
        /**
         * Package name.
         *
         * @type {string}
         */
        this.packageName = packageName;

        /**
         * A list of manifest tasks.
         *
         * @type {ManifestTask[]}
         */
        this.tasks = [];
    }

    /**
     * Gets whether the manifest is valid.
     *
     * @return {boolean}
     */
    isValid() {
        if (!this.packageName) {
            return false;
        }

        for (let i = 0; i < this.tasks.length; i++) {
            let _task = this.tasks[i];

            if (!_task.isValid()) {
                return false;
            }
        }

        return true;
    }

    /**
     * Reads and parses a ButterbotManifest file from a given path.
     *
     * @param {string} packageName
     * @param {string} path
     * @return Manifest
     */
    static parseFromPath(packageName, path) {
        let raw = fs.readFileSync(path, "utf8");

        if (!raw) {
            throw new Error('Manifest file could not be read');
        }

        return Manifest.parseFromText(packageName, raw);
    }

    /**
     * Parses raw JSON text into a Manifest object.
     *
     * @param {string} packageName
     * @param {string} text - Raw input text (encoded JSON).
     * @return {Manifest}
     */
    static parseFromText(packageName, text) {
        let data = JSON.parse(text);

        if (!data) {
            throw new Error('Manifest does not contain valid JSON');
        }

        return Manifest.fromData(packageName, data);
    }

    /**
     * Creates a Manifest file from an Object.
     *
     * @param {string} packageName
     * @param {Object} data - Raw data (usually parsed JSON from a manifest file).
     * @return {Manifest}
     */
    static fromData(packageName, data) {
        let manifest = new Manifest(packageName);

        if (data.tasks) {
            for (let i = 0; i < data.tasks.length; i++) {
                let _taskData = data.tasks[i];
                manifest.tasks.push(ManifestTask.fromData(this, _taskData));
            }
        }

        return manifest;
    }
}

Manifest.MANIFEST_NAME = "butterbot.json";
Manifest.MANIFEST_REL_PATH = `/${Manifest.MANIFEST_NAME}`;

module.exports = Manifest;
