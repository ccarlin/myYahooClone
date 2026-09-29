const test = require('node:test');
const assert = require('node:assert');
const { isPrivateAddress, assertPublicUrl, stripHtml } = require('../server.js');

test('stripHtml handles the feedsmith v3 summary object', () => {
  // feedsmith v3 returns item.summary as { value, type }.
  const summary = { value: 'Apple’s first foldable isn’t available.', type: 'html' };
  assert.equal(stripHtml(summary), 'Apple’s first foldable isn’t available.');
});

test('stripHtml still handles plain strings', () => {
  assert.equal(stripHtml('<p>Hello <b>world</b></p>'), 'Hello world');
});

test('stripHtml decodes entities', () => {
  assert.equal(stripHtml('a &amp; b &lt;c&gt;'), 'a & b <c>');
});

test('stripHtml tolerates empty and unusable input', () => {
  assert.equal(stripHtml(undefined), undefined);
  assert.equal(stripHtml(null), undefined);
  assert.equal(stripHtml(''), undefined);
  assert.equal(stripHtml({}), undefined);
  assert.equal(stripHtml({ type: 'html' }), undefined);
  assert.equal(stripHtml(42), undefined);
});

test('isPrivateAddress blocks loopback in both families', () => {
  assert.equal(isPrivateAddress('127.0.0.1'), true);
  assert.equal(isPrivateAddress('127.1.2.3'), true);
  assert.equal(isPrivateAddress('::1'), true);
  assert.equal(isPrivateAddress('0:0:0:0:0:0:0:1'), true);
});

test('isPrivateAddress blocks RFC1918 ranges', () => {
  assert.equal(isPrivateAddress('10.0.0.1'), true);
  assert.equal(isPrivateAddress('172.16.0.1'), true);
  assert.equal(isPrivateAddress('172.31.255.255'), true);
  assert.equal(isPrivateAddress('192.168.1.1'), true);
});

test('isPrivateAddress blocks the 172.15/172.32 boundaries', () => {
  assert.equal(isPrivateAddress('172.15.0.1'), false);
  assert.equal(isPrivateAddress('172.32.0.1'), false);
});

test('isPrivateAddress blocks link-local and cloud metadata', () => {
  assert.equal(isPrivateAddress('169.254.169.254'), true);
  assert.equal(isPrivateAddress('169.254.0.1'), true);
  assert.equal(isPrivateAddress('fe80::1'), true);
});

test('isPrivateAddress blocks CGNAT, benchmarking, multicast and reserved', () => {
  assert.equal(isPrivateAddress('100.64.0.1'), true);
  assert.equal(isPrivateAddress('198.18.0.1'), true);
  assert.equal(isPrivateAddress('224.0.0.1'), true);
  assert.equal(isPrivateAddress('240.0.0.1'), true);
  assert.equal(isPrivateAddress('0.0.0.0'), true);
});

test('isPrivateAddress does not blanket-block 192.0.0.0/24', () => {
  // Only genuinely internal targets are blocked; see the DNS-interception test.
  assert.equal(isPrivateAddress('192.0.0.1'), false);
});

test('isPrivateAddress blocks IPv6 unique-local', () => {
  assert.equal(isPrivateAddress('fc00::1'), true);
  assert.equal(isPrivateAddress('fd12:3456::1'), true);
});

test('isPrivateAddress unwraps IPv4-mapped IPv6', () => {
  assert.equal(isPrivateAddress('::ffff:127.0.0.1'), true);
  assert.equal(isPrivateAddress('::ffff:10.0.0.1'), true);
  assert.equal(isPrivateAddress('::ffff:169.254.169.254'), true);
  assert.equal(isPrivateAddress('::ffff:8.8.8.8'), false);
});

test('isPrivateAddress allows ordinary public addresses', () => {
  assert.equal(isPrivateAddress('8.8.8.8'), false);
  assert.equal(isPrivateAddress('1.1.1.1'), false);
  assert.equal(isPrivateAddress('93.184.216.34'), false);
  assert.equal(isPrivateAddress('2606:2800:220:1:248:1893:25c8:1946'), false);
});

// Networks that intercept DNS return synthetic addresses for unrelated public
// hostnames. Real sites below all resolved into 192.0.66.0/24 and must not be
// treated as internal, or every feed breaks on such a network.
test('isPrivateAddress allows public hosts behind DNS interception', () => {
  assert.equal(isPrivateAddress('192.0.66.145'), false); // www.cnet.com
  assert.equal(isPrivateAddress('192.0.66.220'), false); // techcrunch.com
  assert.equal(isPrivateAddress('192.0.66.48'), false);  // theonion.com
  assert.equal(isPrivateAddress('192.0.66.176'), false); // variety.com
  assert.equal(isPrivateAddress('192.0.66.108'), false); // www.nasa.gov
});

test('isPrivateAddress treats unparseable input as unsafe', () => {
  assert.equal(isPrivateAddress('not-an-ip'), true);
  assert.equal(isPrivateAddress(''), true);
});

test('assertPublicUrl rejects non-http schemes', async () => {
  await assert.rejects(() => assertPublicUrl('file:///etc/passwd'), /http or https/);
  await assert.rejects(() => assertPublicUrl('gopher://example.com'), /http or https/);
});

test('assertPublicUrl rejects malformed URLs', async () => {
  await assert.rejects(() => assertPublicUrl('not a url'), /Invalid feed URL/);
});

test('assertPublicUrl rejects literal loopback and metadata targets', async () => {
  await assert.rejects(() => assertPublicUrl('http://127.0.0.1:5000/'), /private or reserved/);
  await assert.rejects(() => assertPublicUrl('http://169.254.169.254/latest/meta-data/'), /private or reserved/);
  await assert.rejects(() => assertPublicUrl('http://[::1]/'), /private or reserved/);
});

test('assertPublicUrl rejects hostnames that resolve into private space', async () => {
  await assert.rejects(() => assertPublicUrl('http://localhost/'), /private or reserved/);
});

test('assertPublicUrl rejects unresolvable hosts', async () => {
  await assert.rejects(
    () => assertPublicUrl('http://this-host-does-not-exist.invalid/'),
    /Could not resolve host/
  );
});
