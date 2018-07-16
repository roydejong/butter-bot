# Package development

Butter Bot (*BB*) has been designed to be as modular as possible. This means that most of its functionality comes from (sub)packages that have been designed for it.

This guide contains basic information for developers on how these packages should be set up, published, and how they can be used within BB.

## Package specifications

A BB package can provide one or more of the following:

 - **Task definitions:** Types of (scripted) tasks that can be executed by BB once loaded from the package.
 - **Channels**: Input and output channels for reading/writing data and (push) messages.

To qualify as a BB-compatible package, it must have a valid butterbot manifest file (see below).

There are no other particular requirements, which means a package does not need to be exclusively dedicated to BB. 

## Manifest file

Each Butter Bot package must contain a `butterbot.json` manifest file in its project root (at the same level as its `package.json`).

The manifest file provides some basic information about the package, and what functionality it provides to Butter Bot.

A typical manifest file might look like this:

    {  
       "tasks": [  
          {  
             "name": "serve-butter",
             "require": "src/tasks/ServeButter.js"
          }
       ]
    }
    
This manifest file exposes a new task to us, and instructs us how to load / require that task when it is due to be executed.
    
### Task definitions

The manifest root may contain a `tasks` array that contains any amount of task definitions. Each task definition is an object, with the following supported properties:

|Variable|Type|Description|Notes|
|----|----|-------|-----|
|**`name`**|`string`|Globally (world) unique name / identifier for this task. This name will be used internally whenever referring to this task.|Required, unique|
|**`require`**|`string`|The relative path to the module that should be `require()`'d by Butter Bot. Relative to the path the module is installed in.|Required|

## Publishing

The built-in package management solution uses `npm` as its backend, and assumes that you publish your packages publicly to npm.

At this time, the only supported distribution method for new packages is to publish them to npm as usual (`npm publish`).

## Installing packages to Butter Bot

Please refer to the main [README file](../README.md) for end user package management instructions.

In short summary, once your package has been published, you can tell `butterbot` to install and register it for you.

To install a package, simply run `butterbot -i` with the typical npm package conventions, and using your freshly published package name. For example, if your package is called `butterbot-butter` you could use:

    butterbot --install butterbot-butter@latest

This command will install or update the corresponding npm package (equivalent of calling `npm install butterbot-butter@latest`).

Once the npm package has installed successfully, the bot will look for and parse the manifest file. If things look OK, the package will be registered in the local database file so it can be used.

Manifest files are required; installation of your package will fail if there is no `butterbot.json` file in the root of your project.

## Automatic package maintenance 

Whenever BB is ran, it automatically installs or updates packages that are registered in its database if they appear to be missing, or the wrong version. The BB database effectively acts as a custom lock file. 

