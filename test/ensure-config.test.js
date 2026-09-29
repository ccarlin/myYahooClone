const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { ensureConfig, CONFIG, EXAMPLE } = require('../scripts/ensure-config.js');

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ensure-config-'));
}

test('the real example template exists and is valid JSON', () => {
  assert.ok(fs.existsSync(EXAMPLE), 'myyahoo.example.json must be tracked');
  const data = JSON.parse(fs.readFileSync(EXAMPLE, 'utf8'));
  for (const key of ['Portfolios', 'WeatherAreas', 'NewsFeeds', 'Sports']) {
    assert.ok(Array.isArray(data[key]), `expected ${key} to be an array`);
  }
});

test('seeds the config from the example when it is missing', () => {
  const dir = tmpdir();
  const config = path.join(dir, 'myyahoo.json');
  const example = path.join(dir, 'myyahoo.example.json');
  fs.writeFileSync(example, JSON.stringify({ Portfolios: [], NewsFeeds: [] }));

  const result = ensureConfig(config, example);

  assert.equal(result.created, true);
  assert.ok(fs.existsSync(config), 'config should have been created');
  assert.deepEqual(JSON.parse(fs.readFileSync(config, 'utf8')), { Portfolios: [], NewsFeeds: [] });
});

test('never overwrites an existing config', () => {
  const dir = tmpdir();
  const config = path.join(dir, 'myyahoo.json');
  const example = path.join(dir, 'myyahoo.example.json');
  fs.writeFileSync(config, JSON.stringify({ Portfolios: ['MINE'] }));
  fs.writeFileSync(example, JSON.stringify({ Portfolios: ['EXAMPLE'] }));

  const result = ensureConfig(config, example);

  assert.equal(result.created, false);
  assert.equal(result.reason, 'already exists');
  assert.deepEqual(JSON.parse(fs.readFileSync(config, 'utf8')), { Portfolios: ['MINE'] });
});

test('is idempotent across repeated runs', () => {
  const dir = tmpdir();
  const config = path.join(dir, 'myyahoo.json');
  const example = path.join(dir, 'myyahoo.example.json');
  fs.writeFileSync(example, JSON.stringify({ a: 1 }));

  assert.equal(ensureConfig(config, example).created, true);
  assert.equal(ensureConfig(config, example).created, false);
  assert.equal(ensureConfig(config, example).created, false);
});

test('keeps the template intact so later installs can reseed', () => {
  const dir = tmpdir();
  const config = path.join(dir, 'myyahoo.json');
  const example = path.join(dir, 'myyahoo.example.json');
  fs.writeFileSync(example, JSON.stringify({ v: 'template' }));

  ensureConfig(config, example);
  fs.writeFileSync(config, JSON.stringify({ v: 'user edits' }));
  fs.rmSync(config);
  ensureConfig(config, example);

  assert.ok(fs.existsSync(example), 'example must survive being seeded');
  assert.deepEqual(JSON.parse(fs.readFileSync(config, 'utf8')), { v: 'template' });
});

test('reports a clear error when the example is missing', () => {
  const dir = tmpdir();
  assert.throws(
    () => ensureConfig(path.join(dir, 'myyahoo.json'), path.join(dir, 'nope.json')),
    /template .* is missing/
  );
});

test('reports a clear error when the example is not valid JSON', () => {
  const dir = tmpdir();
  const example = path.join(dir, 'myyahoo.example.json');
  fs.writeFileSync(example, '{ not json');
  assert.throws(() => ensureConfig(path.join(dir, 'myyahoo.json'), example));
});

test('detects a directory standing in for the config', () => {
  // Docker creates a directory when a bind-mount source does not exist.
  const dir = tmpdir();
  const config = path.join(dir, 'myyahoo.json');
  fs.mkdirSync(config);
  assert.throws(() => ensureConfig(config, path.join(dir, 'myyahoo.example.json')), /not a file/);
});
