const logger = require('../Core/ButterLog').logger;
const db = require('../Core/ButterDb').db;
const SyncRemote = require('./SyncRemote');

class SyncManager {
    /**
     * Shuts down sync manager and kills any open channels.
     */
    static shutdown() {
        if (!this.remotes) {
            return;
        }

        for (let i = 0; i < this.remotes.length; i++) {
            let _remote = this.remotes[i];

            try {
                _remote.killChannel();
            } catch (e) { }
        }

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
        logger.info(`[sync] Configured with ${this.remotes.length} remote(s).`);

        for (let i = 0; i  <this.remotes.length; i++) {
            let _remote = this.remotes[i];
            _remote.getChannel().connect()
                .then(() => { })
                .catch(() => { })
        }

        // Start interval for auto-reconnect on failure
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

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
