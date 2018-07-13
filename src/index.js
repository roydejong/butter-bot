#!/usr/bin/env node

/**
 * Welcome to Butter Bot!
 *
 * @see https://www.npmjs.com/package/butter-bot
 * @see https://github.com/roydejong/butter-bot
 *
 * @licence MIT (See included LICENSE file for details)
 * @copyright Copyright (c) 2018 Roy de Jong
 */

require('./Core/ButterBot').start(process.argv.slice(2), false);
