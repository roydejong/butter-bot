/**
 * Bootstrap file for Mocha/Chai test suite
 */

const ButterBot = require('../src/Core/ButterBot');
ButterBot.start(["-q", "-d data/mocha.json", "--no-stdout"], true);