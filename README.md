# Customer Service Bot Example

This project demonstrates a simple LINE Bot that sends a link to a web form when a user adds the bot as a friend. The form submits data back to the bot. It now uses Dify to generate replies to user messages.

## Features

- Uses the `@line/bot-sdk` and `express` packages.
- Generates replies using Dify.
- Handles LINE `follow` events to send a form link containing the LINE user ID.
- Serves a basic HTML form at `/form`.
- The form collects the user's name, prefecture, address, phone number, email, driving history, whether they own a delivery vehicle and whether they have a driving license.
- On form submission, the bot sends a confirmation message back to the user.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the following environment variables:
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
  - `GAS_URL` pointing to your Google Apps Script web app
  - `DIFY_API_KEY` for Dify
  - Optional: `DIFY_SYSTEM_PROMPT` to customize Dify's system prompt
  - `BOOKING_URL` URL the user is directed to when accepting a deal
   - Optional: `PORT` for the server (defaults to `3000`).
3. Start the server:
   ```bash
   npm start
   ```

Deploy the server publicly and configure the LINE Developers Console webhook URL to point to `/webhook`.

