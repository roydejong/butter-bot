<p align="center">
 <img src="https://github.com/roydejong/butter-bot/raw/master/etc/Butter_Robot+text.sm.png" alt="Butter Bot" width="175"><br />
 <strong><em>"What is my purpose?"<br /><br /></em></strong>
 <a href="https://travis-ci.org/roydejong/butter-bot"><img src="https://img.shields.io/travis/roydejong/butter-bot.svg" alt="Build Status"></a>
 <a href="https://www.npmjs.com/package/butter-bot"><img src="https://img.shields.io/npm/v/butter-bot.svg" alt="Package on npm"></a>
 <a href="https://david-dm.org/roydejong/butter-bot"><img src="https://img.shields.io/david/roydejong/butter-bot.svg" alt="Dependencies"></a>
 <a href="https://discord.gg/hGKZCxm"><img src="https://img.shields.io/discord/466643105412808725.svg" alt="Discord"></a>
</p>

## About Butter Bot

Butter Bot is a general purpose bot that can perform a variety of tasks asynchronously. Give it purpose and put it to work!

## Getting started

The Butter Bot [package](https://www.npmjs.com/package/butter-bot) is available via npm as `butter-bot`. The easiest way to get started is to install it on your system globally:

    npm i --global butter-bot  

Once installed, the `butterbot` executable will be available on your system. To start the bot, simply run:

    butterbot

If everything is working correctly, the bot will continue running indefinitely until it is stopped manually. You can trigger a safe shutdown by sending the interrupt signal (<kbd>CTRL</kbd> + <kbd>C</kbd>).

Before the Butter Bot does anything useful, you need to give it purpose. You will need to define a task list, or connect it to a task server like [Opdroid.com](https://www.opdroid.com).

### Command line options

For an overview of all command line and usage options, use `butterbot --help`. You can also view the raw [help text](etc/help+usage.txt).