// Checks that Express serves the app. Run with: npm test
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../server');

let server;
let base;

before(async () => {
  server = app.listen(0); // random free port
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

test('GET / serves the page', async () => {
  const res = await fetch(base + '/');
  assert.strictEqual(res.status, 200);
  const html = await res.text();
  assert.match(html, /CUBE<span>\/\/<\/span>UNBOUND/);
  assert.match(html, /href="css\/style.css"/);
  assert.match(html, /src="js\/main.js"/);
});

test('GET /css/style.css serves the stylesheet', async () => {
  const res = await fetch(base + '/css/style.css');
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/css/);
});

test('GET /js/main.js serves the script', async () => {
  const res = await fetch(base + '/js/main.js');
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /javascript/);
});

test('unknown paths return 404', async () => {
  const res = await fetch(base + '/no-such-page');
  assert.strictEqual(res.status, 404);
});
