# Schedule expressions

Butter Bot uses **schedule expressions** to determine when tasks should be executed next. These expressions try to follow natural English language, but have some predefined rules.

## Basic syntax

### Examples 

If you want some quick examples to get you started, refer to this table for most common use cases:

|Example expression|Interpreted as|
|---|---|
|`today`|Run this task only once, today (any time)|
|`wednesday`|Run this task only once, this wednesday (any time)|
|`every day`|Run this task once, every day (any time)|
|`every day at 15:30`|Run this task once, every day, at 3:30pm|
|`every wednesday at noon`|Run this task once a week, on Wednesdays, at midday|
|`every wednesday and friday at 3pm`|Run this task once a week, on Wednesdays and Fridays, at 15:00 on both days|

### Combining expressions

You may also combine multiple expressions with commas. For example:

|Example expression|Interpreted as|
|---|---|
|`today, tomorrow at 3pm`|Runs once today at an unspecified time, and then again one day later at 13:00|
|`every wednesday, every day at 3pm`|Runs every wednesday at an unspecified time, and once every day at 13:00 (*and therefore twice in total on wednesdays*)| 

It is important to note that terms like `today` and `tomorrow` are relative to when Butter Bot **starts** (and first evaluates the schedule expression).

### Using priorities

Each instance of Butter Bot will only execute **one task at a time**, synchronously.

If you schedule a task to run every second, for example, it might overshadow other tasks and prevent them from executing at all. To balance this, you can define **priorities**.

## In depth

### Supported time formats

The following time formats are understood and considered valid. Any formats not listed here may not be understood and will likely result in a syntax error.

#### 24-hour formats

|Format|Example|12-hour equivalent|
|---|---|---|
|`HH:mm`|15:43|3:43 pm|
|`HH:mm:ss`|15:43:21|3:43:21 pm|

#### 12-hour formats

|Format|Example|24-hour equivalent|
|---|---|---|
|`h:hha`|3:43pm|15:43|
|`h:hh:ssa`|3:43:21pm|15:43:21|
|`ha`|3pm|15:00|

**Note:** You cannot have a space between the time and `am`/`pm`.