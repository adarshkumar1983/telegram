# Telegram Joke Bot

This is a Telegram bot that sends you random jokes at configurable intervals.

## Prerequisites

* Node.js
* npm
* MongoDB

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/your-username/telegram-joke-bot.git
   ```
2. Install the dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add your Telegram bot token and MongoDB connection string:
   ```
   TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
   MONGODB_URI=YOUR_MONGODB_URI
   ```
4. Start the bot:
   ```
   node index.js
   ```

## Commands

* `/start` - Start the bot and receive a welcome message.
* `/enable` - Enable joke delivery.
* `/disable` - Disable joke delivery.
* `/setfrequency <minutes>` - Set the frequency of joke delivery in minutes.
