const test = require('node:test');
const assert = require('node:assert');
const { toText } = require('../server.js');

// feedsmith v3 normalizes some fields into { value, type } objects and omits
// others entirely depending on the feed format (RSS vs Atom/RDF). Anything
// reaching React as an object child crashes the whole tree, so these must
// always resolve to a string or undefined.

test('toText unwraps a { value, type } object', () => {
  const title = { value: 'Look Out for This iPhone Duo Preorder Scam', type: 'html' };
  assert.equal(toText(title), 'Look Out for This iPhone Duo Preorder Scam');
});

test('toText passes plain strings through', () => {
  assert.equal(toText('plain title'), 'plain title');
});

test('toText unwraps a { value, isPermaLink } guid object', () => {
  assert.equal(toText({ value: 'https://example.com/a', isPermaLink: true }), 'https://example.com/a');
});

test('toText unwraps a { href, rel } link object', () => {
  assert.equal(toText({ href: 'https://example.com/b', rel: 'alternate' }), 'https://example.com/b');
});

test('toText takes the first href from a links array', () => {
  const links = [{ rel: 'self', href: 'https://example.com/self' }, { rel: 'alternate', href: 'https://example.com/post' }];
  assert.equal(toText(links), 'https://example.com/self');
});

test('toText returns undefined for unusable values', () => {
  assert.equal(toText(undefined), undefined);
  assert.equal(toText(null), undefined);
  assert.equal(toText(''), undefined);
  assert.equal(toText({}), undefined);
  assert.equal(toText({ type: 'html' }), undefined);
  assert.equal(toText([]), undefined);
  assert.equal(toText(42), undefined);
  assert.equal(toText(true), undefined);
});

test('toText guards against non-string value members', () => {
  assert.equal(toText({ value: { nested: true } }), undefined);
  assert.equal(toText({ value: 7 }), undefined);
});

test('toText output is always renderable as a React child', () => {
  const samples = [
    { value: 'object title', type: 'html' },
    'string title',
    undefined,
    { href: 'https://example.com' },
    [{ href: 'https://example.com/from-array' }],
  ];
  for (const sample of samples) {
    const result = toText(sample);
    assert.ok(result === undefined || typeof result === 'string', `expected string|undefined, got ${typeof result}`);
  }
});
