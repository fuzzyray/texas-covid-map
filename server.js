const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.get(['/', '/:name'], (req, res) => {
  const now = new Date();
  const fileName = path.join(__dirname + ((name) => {
    return name ? `/${name}` : '/index.html';
  })(req.params.name));
  res.sendFile(fileName);
  console.log(
      `${now.toLocaleDateString()} ${now.toLocaleTimeString()}: GET: ${fileName}`);
});

app.listen(port,
    () => console.log(`App listening on http://localhost:${port}`));