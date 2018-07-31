# Discord for Butter Bot

**This package provides integration tasks for Discord.**

## Task: `discord-webhook`

This task can send a message to a Discord channel via a [webhook](https://discordapp.com/developers/docs/resources/webhook).

You must create the webhook on a server first (via the Discord app), and then set the full webhook URL on the tasks's `url` property.

This task does not yet support rich embeds and file uploads (*Coming Soon™*), but it does support text messages with optional overrides for username, avatar and TTS.

<img src="docs/webhook-example.png" alt="Webhook example">

