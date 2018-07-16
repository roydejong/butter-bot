const fs = require('fs');
const ManifestTask = require('./ManifestTask');

/**
 * Represents data from Butter Bot manifest files, and provides utilities for reading and parsing them.
 */
class Manifest {
    /**
     * Construct new, blank manifest data.
     */
    constructor() {
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
     * @return Manifest
     */
    static parseFromPath(path) {
        let raw = fs.readFileSync(path, "utf8");

        if (!raw) {
            throw new Error('Manifest file could not be read');
        }

        return Manifest.parseFromText(raw);
    }

    /**
     * Parses raw JSON text into a Manifest object.
     *
     * @param {string} text - Raw input text (encoded JSON).
     * @return {Manifest}
     */
    static parseFromText(text) {
        let data = JSON.parse(text);

        if (!data) {
            throw new Error('Manifest does not contain valid JSON');
        }

        return Manifest.fromData(data);
    }

    /**
     * Creates a Manifest file from an Object.
     *
     * @param {Object} data - Raw data (usually parsed JSON from a manifest file).
     * @return {Manifest}
     */
    static fromData(data) {
        let manifest = new Manifest();

        if (data.tasks) {
            for (let i = 0; i < data.tasks.length; i++) {
                let _taskData = data.tasks[i];
                manifest.tasks.push(ManifestTask.fromData(_taskData));
            }
        }

        return manifest;
    }
}

Manifest.MANIFEST_NAME = "butterbot.json";
Manifest.MANIFEST_REL_PATH = `/${Manifest.MANIFEST_NAME}`;

module.exports = Manifest;
