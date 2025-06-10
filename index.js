const express = require('express');
const line = require('@line/bot-sdk');
const path = require('path');

const config = {
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const client = new line.Client(config);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// webhook endpoint for LINE
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// simple form page
app.get('/form', (req, res) => {
  const userId = req.query.userId || '';
  res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Input</title></head>
<body>
  <form method="POST" action="/submit">
    <input type="hidden" name="userId" value="${userId}">
    <label>Name: <input type="text" name="name"></label><br>
    <button type="submit">Send</button>
  </form>
</body>
</html>`);
});

// handle form submission
app.post('/submit', (req, res) => {
  const { userId, name } = req.body;
  // send to LINE webhook (example: push message)
  if (userId && name) {
    client.pushMessage(userId, { type: 'text', text: `Received: ${name}` })
      .then(() => {
        res.send('Thank you!');
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error');
      });
  } else {
    res.status(400).send('Missing parameters');
  }
});

function handleEvent(event) {
  if (event.type === 'follow') {
    const userId = event.source.userId;
    const link = `https://your-domain.com/form?userId=${userId}`;
    const messages = [{ type: 'text', text: `Please fill the form: ${link}` }];
    return client.replyMessage(event.replyToken, messages);
  }
  return Promise.resolve(null);
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
