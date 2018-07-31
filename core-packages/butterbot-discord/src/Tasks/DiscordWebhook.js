const ButterTask = require('butterbot-sdk').ButterTask;
const axios = require('axios');

/**
 * Task that handles POSTing a message to a Discord webhook.
 */
class DiscordWebhook extends ButterTask {
    /**
     * @returns {Promise}
     */
    run() {
        let url = this.getUrl();

        let payload = {
            content: this.job.getProp('content') || "",
            username: this.job.getProp('username') || null,
            avatar_url: this.job.getProp('avatar_url') || null,
            tts: !!this.job.getProp('tts'),
            file: null, // TODO - the contents of the file being sent. request must use multipart/form-data for uploads.
            embeds: null, // TODO - embedded rich content. https://discordapp.com/developers/docs/resources/channel#embed-object
        };

        return axios.post(url, payload);
    }

    /**
     * Determines final target URL.
     *
     * @returns {string}
     */
    getUrl() {
        let url = this.job.getProp('url');

        // Append "wait" query parameter if requested
        if (this.job.getProp('wait')) {
            if (url.indexOf('?') > 0) {
                url += "&";
            } else {
                url += "?";
            }

            url += "wait=true"
        }

        return url;
    }
}

module.exports = DiscordWebhook;
