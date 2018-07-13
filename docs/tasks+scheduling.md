# Tasks and scheduling

This document summarizes how tasks work within Butter Bot, what functionality they offer, and how they can be scheduled.

## System and definitions

### Packages

A **package** is a regular package, not unlike any other node package, that can introduce new functionality and behaviors to Butter Bot.

At the time of writing, only packages hosted on [npm](https://www.npmjs.com) are fully supported. However, any package available to the bot during runtime can work. 

Most commonly, packages provide **Tasks** that we can then schedule to be executed by the bot.

For information on developing new packages for Butter Bot, please refer to the [Package development guide](./package-development.md).

### Tasks

#### Package tasks

A **task** (or **package task** to be exact) is, in its simplest form, a piece of code provided by a **package** that can be executed by Butter Bot.

Butter Bot defines some tasks of its own; these are marked as `builtin` and are the exception to the rule, as they are the only tasks not provided by an external package.

#### Scheduled tasks

We can schedule tasks to be executed by the bot. One task can be scheduled multiple times, with variations on the parameters or schedule.

A **scheduled task** (or **planned task**) is unique to each Butter Bot instance, and tells the bot when and how to execute a task.

### Jobs

When a task is executed, that single **unit of work** is referred to as a **job**. A job can succeed or fail. This is where the real work happens.

