const logger = require('../Core/ButterLog').logger;
const SyncChannel = require('./SyncChannel');

/**
 * Remote server record.
 * A "remote" refers to an external task server that we exchange configuration data and task lists with.
 */
class SyncRemote {
    /**
     * @param {string} url - Gateway server base URL (e.g. "https://test.com").
     * @param {string|null} apiKey - Authentication key for Gateway server (usually a hash).
     */
    constructor(url, apiKey) {
        this.url = url;
        this.apiKey = apiKey || null;
        this.channel = null;
    }

    /**
     * Gets Channel singleton for this Remote.
     *
     * @returns {SyncChannel}
     */
    getChannel() {
        if (!this.channel) {
            this.channel = new SyncChannel(this.websocketUrl);
        }

        return this.channel;
    }

    /**
     * Ensures any open channel is closed.
     */
    killChannel() {
        if (this.channel) {
            this.channel.disconnect();
        }

        this.channel = null;
    }

    /**
     * Gets the protocol (e.g. "http" or "https").
     *
     * @returns {string}
     */
    get protocol() {
        return this.url.substr(0, this.url.indexOf("://"));
    }

    /**
     * Gets the URL path without protocol or auth (e.g. "bla.com").
     *
     * @returns {string}
     */
    get path() {
        let u = this.url;
        let p = this.protocol;
        return u.substr(p.length + 3);
    }

    /**
     * Gets whether the used protocol is secure.
     *
     * @returns {boolean}
     */
    get isSecure() {
        return this.protocol === "https";
    }

    /**
     * Gets the DSN for the remote.
     *
     * @returns {string}
     */
    get dsn() {
        // Protocol
        let url = `${this.protocol}://`;

        // Auth info
        if (this.apiKey) {
            url += `${this.apiKey}@`;
        }

        // Base URL
        url += this.path;
        return url;
    }

    /**
     * Gets the websocket URL for the remote.
     *
     * @returns {string}
     */
    get websocketUrl() {
        let protocol = (this.isSecure ? "wss" : "ws");
        let wsPath = "/ws-api";

        return `${protocol}://${this.path}${wsPath}`;
    }

    /**
     * Parses a SyncRemote instance from a DSN.
     *
     * @throws I'll throw up if you feed me a bad DSN.
     *
     * @param {string} dsn - Data Source Name / Connection string.
     * @return {SyncRemote}
     */
    static fromDsn(dsn) {
        // Read protocol (http:// or https://)
        let idxProtocol = dsn.indexOf("://");

        if (idxProtocol === -1) {
            throw new Error('DSN parse error: Protocol is missing (e.g. "https://").')
        }

        let protocol = dsn.substr(0, idxProtocol);

        // Validate protocol
        if (protocol === "http") {
            logger.warn(`[remote] Security warning: DSN uses plain HTTP - ${dsn}`);
        } else if (protocol === "https") {
            // Ok
        } else {
            throw new Error('DSN parse error: Invalid protocol (expected "http" or "https").');
        }

        // Get remainder, and separate auth info from URL
        let dsnRemainder = dsn.substr(idxProtocol + 3);
        let atIndex = dsnRemainder.indexOf('@');
        let authInfo = null;

        if (atIndex >= 0) {
            authInfo = dsnRemainder.substr(0, atIndex);
            dsnRemainder = dsnRemainder.substr(atIndex + 1);
        }

        // Remove trailing slash if present
        if (dsnRemainder.substr(-1) === '/') {
            dsnRemainder = dsnRemainder.substr(0, dsnRemainder.length - 1);
        }

        // Return result
        let finalUrl = `${protocol}://${dsnRemainder}`;
        return new SyncRemote(finalUrl, authInfo);
    }
}

module.exports = SyncRemote;
