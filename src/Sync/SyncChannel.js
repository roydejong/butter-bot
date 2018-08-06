const Socket = require("phoenix-channels").Socket;
const logger = require('../Core/ButterLog').logger;

/**
 * Connection instance to a SyncRemote's API channel.
 */
class SyncChannel {
    /**
     *
     * @param {string} websocketUrl
     */
    constructor(websocketUrl) {
        this.websocketUrl = websocketUrl;
        this.socket = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.disconnect();

            try {
                // Server connect
                logger.info(`[sync] (${this.websocketUrl}) Connecting to remote...`);

                this.socket = new Socket(this.websocketUrl, {
                    params: { }
                });
                this.socket.connect();

                // Bind events for debugging / logging
                this.socket.onClose(() => {
                    logger.debug(`[sync] (${this.websocketUrl}) Connection closed.`);

                    this.disconnect();
                });

                this.socket.onError((e) => {
                    logger.error(`[sync] (${this.websocketUrl}) Connection closed due to an error: ${e}`);

                    this.disconnect();
                });

                // Queue up the channel join, and await that result
                let chanName = `${SyncChannel.API_CHANNEL_PREFIX}:default`;

                this.channel = this.socket.channel(chanName);
                this.channel.join()
                    .receive("ok", (resp) => {
                        logger.debug(`[sync] (${this.websocketUrl}) OK -> Response: ${JSON.stringify(resp)}`);
                        logger.info(`[sync] (${this.websocketUrl}) Connected. Joined channel ${chanName}`);
                        resolve();
                    })
                    .receive("error", (resp) => {
                        logger.debug(`[sync] (${this.websocketUrl}) ERR -> Response: ${JSON.stringify(resp)}`);
                        logger.error(`[sync] (${this.websocketUrl}) Connection failed, could not join channel.`);

                        this.disconnect();

                        reject(new Error(`Unable to join channel: ${resp}`));
                    });
            } catch (e) {
                logger.error(`[sync] (${this.websocketUrl}) ${e || "An unspecified connection error occurred."}`);
                reject(e);
            }
        });
    }

    disconnect() {
        if (this.socket) {
            try {
                this.socket.disconnect();
            } catch (e) { }

            logger.debug(`[sync] (${this.websocketUrl}) Disconnected from channel.`);
        }

        this.socket = null;
    }

    get isConnected() {
        if (!this.socket) {
            return false;
        }

        if (!this.socket.isConnected()) {
            return false;
        }

        let anyJoinedChannels = false;

        for (let i = 0; i < this.socket.channels; i++) {
            let _channel = this.socket.channels[i];

            if (_channel.state === "joined") {
                anyJoinedChannels = true;
                break;
            }
        }

        return anyJoinedChannels;
    }
}

SyncChannel.API_CHANNEL_PREFIX = "worker";

module.exports = SyncChannel;
