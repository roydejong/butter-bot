const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

/**
 * Utility class for accessing the local database.
 */
class ButterDb {
    /**
     * Initializes the database.
     *
     * @param {?string} filename - Absolute or relative path to the database *.json file.
     */
    static init(filename) {
        this.adapter = new FileSync(filename || ButterDb.DEFAULT_FILENAME);
        this.db = low(this.adapter);

        this._setDefaults();

        this.db
            .set('diagnostic.schema_version_current', ButterDb.SCHEMA_VERSION)
            .set('diagnostic.last_run', new Date())
            .write();
    }

    /**
     * Gets the filename used.
     */
    static getFilename() {
        return this.adapter.source;
    }

    /**
     * Initializes the database with a default schema.
     *
     * @private
     */
    static _setDefaults() {
        let defaults = {
            remotes: [],
            tasks: [],
            packages: [],
            diagnostic: {
                schema_version_init: ButterDb.SCHEMA_VERSION,
                first_run: new Date()
            }
        };

        this.db.defaults(defaults).write();
    }
}

ButterDb.DEFAULT_FILENAME = "data/butterdb.json";
ButterDb.SCHEMA_VERSION = 1;

module.exports = ButterDb;
