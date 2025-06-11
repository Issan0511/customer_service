# Customer Service Bot Example

This project demonstrates a simple LINE Bot that sends a link to a web form when a user adds the bot as a friend. The form submits data back to the bot.

## Features

- Uses the `@line/bot-sdk` and `express` packages.
- Handles LINE `follow` events to send a form link containing the LINE user ID.
- Serves a basic HTML form at `/form`.
- The form collects the driver's name, prefecture code and name, vehicle availability and desired compensation.
- On form submission, the bot sends a confirmation message back to the user.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the following environment variables:
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - Optional: `PORT` for the server (defaults to `3000`).
3. Start the server:
   ```bash
   npm start
   ```

Deploy the server publicly and configure the LINE Developers Console webhook URL to point to `/webhook`.

