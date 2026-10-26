const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the CUBE//UNBOUND page and its CSS/JS from /public.
app.use(express.static(path.join(__dirname, 'public')));

// Anything that isn't a file in /public.
app.use((req, res) => {
  res.status(404).send('Page not found. Go back to <a href="/">CUBE//UNBOUND</a>.');
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong on the server.');
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`CUBE//UNBOUND running at http://localhost:${PORT}`))
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use. Try: PORT=4000 npm start`);
      else console.error(err);
      process.exit(1);
    });
}

module.exports = app;
