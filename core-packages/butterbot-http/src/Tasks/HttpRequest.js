const ButterTask = require('butterbot-sdk').ButterTask;

class HttpRequest extends ButterTask {
    run() {
        console.log('Hello world!', this.job);
    }
}

module.exports = ButterTask;
