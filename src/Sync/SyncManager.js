const logger = require('../Core/ButterLog').logger;
const db = require('../Core/ButterDb').db;
const SyncRemote = require('./SyncRemote');

class SyncManager {
    /**
     * Add remote by DSN.
     *
     * @param {string} dsnToAdd - Connection string
     * @return {boolean}
     */
    static add(dsnToAdd) {
        try {
            SyncRemote.fromDsn(dsnToAdd);
        } catch (e) {
            logger.error(`[sync] Skipping adding invalid DSN "${dsnToAdd}": ${e.message}`);
            return false;
        }

        let dsnList = db
            .get('remotes')
            .value() || [];

        let nextDsnList = [];

        for (let i = 0; i < dsnList.length; i++) {
            let _dsn = dsnList[i];

            if (_dsn === dsnToAdd) {
                logger.error(`[sync] Skipped adding duplicate remote; specified DSN already registered: "${dsnToAdd}"`);
                return false;
            }

            nextDsnList.push(_dsn);
        }

        nextDsnList.push(dsnToAdd);

        db.set('remotes', nextDsnList).write();
        logger.info(`[sync] OK - Added remote: ${dsnToAdd}`);
        return true;
    }

    /**
     * Remove remote by DSN.
     *
     * @param {string} dsnToDrop - Connection string
     * @return {boolean}
     */
    static remove(dsnToDrop) {
        let dsnList = db
            .get('remotes')
            .value() || [];

        let nextDsnList = [];
        let didDrop = false;

        for (let i = 0; i < dsnList.length; i++) {
            let _dsn = dsnList[i];

            if (_dsn === dsnToDrop) {
                didDrop = true;
                continue;
            }

            nextDsnList.push(_dsn);
        }

        if (didDrop) {
            db.set('remotes', nextDsnList).write();
            logger.info(`[sync] OK - Removed remote: ${dsnToDrop}`);
            return true;
        } else {
            logger.error(`[sync] Removal failed; specified remote not registered: ${dsnToDrop}`);
            return false;
        }
    }

    /**
     * Shuts down sync manager and kills any open channels.
     */
    static shutdown() {
        // Stop check interval
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        // Disconnect remote channels
        if (this.remotes) {
            for (let i = 0; i < this.remotes.length; i++) {
                let _remote = this.remotes[i];

                try {
                    _remote.killChannel();
                } catch (e) { }
            }
        }

        // Clear list and await reload via start()
        this.remotes = [];
    }

    /**
     * (Re)start the sync manager and all its managed channels.
     * This will also reload remotes from the database and wipe any local state.
     */
    static start() {
        // (For reloads) - ensure we're clear and shut down
        this.shutdown();

        // Fetch configured remotes from db
        let nextRemotes = [];

        let dbRemotes = db
            .get('remotes')
            .value() || [];

        for (let i = 0; i < dbRemotes.length; i++) {
            let _dbRemoteDsn = dbRemotes[i];

            try {
                let remoteParsed = SyncRemote.fromDsn(_dbRemoteDsn);
                nextRemotes.push(remoteParsed);
            } catch (e) {
                logger.error(`[sync] Invalid remote defined in database (${_dbRemoteDsn}): ${e || "Unknown error"}`);
            }
        }

        this.remotes = nextRemotes;

        if (!this.remotes) {
            return;
        }

        // Each channel should begin connecting now
        for (let i = 0; i  <this.remotes.length; i++) {
            let _remote = this.remotes[i];
            _remote.getChannel().connect()
                .then(() => { })
                .catch(() => { })
        }

        // Start interval for auto-reconnect on failure
        this.checkInterval = setInterval(() => {
            for (let i = 0; i < this.remotes.length; i++) {
                let _remote = this.remotes[i];
                let _chan = _remote.getChannel();

                if (!_chan.isConnected) {
                    logger.debug(`[sync] Auto-reconnect attempt for channel ${_chan.websocketUrl}`);

                    _chan.connect()
                        .then(() => { })
                        .catch(() => { })
                }
            }
        }, SyncManager.RECONNECT_INTERVAL)
    }
}

SyncManager.RECONNECT_INTERVAL = 1000 * 60;

module.exports = SyncManager;
