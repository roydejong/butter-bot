# Tasks and scheduling

This document summarizes how tasks work within Butter Bot, what functionality they offer, and how they can be scheduled.

## System and definitions

### Packages

A **package** is a regular package, not unlike any other node package, that can introduce new functionality and behaviors to Butter Bot.

At the time of writing, only packages hosted on [npm](https://www.npmjs.com) are fully supported. However, any package available to the bot during runtime can work. 

Most commonly, packages provide **Tasks** that we can then schedule to be executed by the bot.

### Task system components

#### Package tasks

A **task** (or **package task** to be exact) is, in its simplest form, a piece of code provided by a **package** that can be executed by Butter Bot.

For information on developing packages that can provide tasks for Butter Bot, please refer to the [Package development guide](./package-development.md).

#### Scheduled tasks

We can schedule tasks to be executed by the bot. One task can be scheduled multiple times, with variations on the parameters or schedule.

A **scheduled task** (or **planned task**) is unique to each Butter Bot instance, and tells the bot when and how to execute a task.

#### Jobs

When a task is executed, that single **unit of work** is referred to as a **job**. A job can succeed or fail. This is where the real work happens.

Summary of how jobs are executed:

1. Based on the scheduled tasks, their [schedule expressions](./schedule-expressions.md) and their priorities, Butter Bot determines which task should be executed next.
2. The task to be executed is instantiated as a new **Job**. The scheduled task data tells that job *what* task to execute, and *how* (parameters).
3. The **Executor** reads the Job information, loads the specified task, and tries to execute that task.
4. The result is passed back and the job has finished. The task loop restarts, and the next job is scheduled, and so forth.
