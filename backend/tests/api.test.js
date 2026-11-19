import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('health endpoint responds with the API status', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
});

test('versioned health endpoint remains available', async () => {
  const response = await fetch(`${baseUrl}/api/v1/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
});

test('development CORS accepts Vite on a dynamically assigned local port', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'http://localhost:5176' }
  });

  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5176');
});

test('unknown API paths return a JSON 404 response', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
});

test('admin endpoints reject requests without authentication', async () => {
  const response = await fetch(`${baseUrl}/api/admin/dashboard`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.message, 'Authentication required.');
});

test('document file endpoint rejects requests without authentication', async () => {
  const response = await fetch(`${baseUrl}/api/documents/012345678901234567890123/file`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.message, 'Authentication required.');
});

test('historical cutoff endpoint requires a signed-in student', async () => {
  const response = await fetch(`${baseUrl}/api/predictor/history`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.message, 'Authentication required.');
});
