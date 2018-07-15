<p align="center">
 <img src="https://github.com/roydejong/butter-bot/raw/master/etc/Butter_Robot+text.sm.png" alt="Butter Bot" width="175"><br />
 <strong><em>"What is my purpose?"<br /><br /></em></strong>
 <a href="https://travis-ci.org/roydejong/butter-bot"><img src="https://img.shields.io/travis/roydejong/butter-bot.svg" alt="Build Status"></a>
 <a href="https://www.npmjs.com/package/butter-bot"><img src="https://img.shields.io/npm/v/butter-bot.svg" alt="Package on npm"></a>
 <a href="https://david-dm.org/roydejong/butter-bot"><img src="https://img.shields.io/david/roydejong/butter-bot.svg" alt="Dependencies"></a>
 <a href="https://discord.gg/hGKZCxm"><img src="https://img.shields.io/discord/466643105412808725.svg" alt="Discord"></a>
</p>

## About Butter Bot

**⚠️ This is pre-release software in active development. It is not yet in a usable state.**

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

## Package management

Butter Bot is modular. To add or extend its functionality, you can install packages that have been designed to work with it.

These packages are usually published on npm, and contain a `butterbot.json` manifest file that describes what functionality it wants to expose to Butter Bot.

For more information on how packages are structured, or how to develop new (sub) packages for Butter Bot, please refer to the [package development document](docs/package-development.md).

### Installing a package

To install and register a new Butter Bot package, simply run:

    butterbot -i bb-sample-package
 
This will perform the npm installation as needed (without modifying our package.json), and register the package to the Butter Bot database file.

 Once registered, Butter Bot will make sure the packages are available and installed as the correct version when it starts.

## Documentation

For further reading, please check out the [`/docs`](./docs) folder in this repository. Topics that might interest you include:

### General use

- [Writing schedule expressions for tasks](./docs/schedule-expressions.md)

### Technical details & development info

- [Developing packages for Butter Bot](./docs/package-development.md)
- [How the task system works + definitions](./docs/tasks+scheduling.md)
 
## Contributing and development

To get started on Butter Bot development, clone the repository to your local system and install its dependencies:

    git clone git@github.com:roydejong/butter-bot.git
    cd butter-bot
    yarn install
     
(We recommend using `yarn` to install dependencies. Alternatively, you can use good old `npm install`.)

We welcome good quality pull requests to this repository. Opening a ticket first greatly increases your chances of the pull request being accepted quickly, and ensures you won't be wasting your time.
