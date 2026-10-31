'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// The mobile app pulls in transitive dependencies whose older versions carry
// known CVEs. The mobile package.json pins patched versions via npm
// "overrides", which must be reflected in its lockfile:
//   - decode-uri-component 0.2.2 -> 0.5.1 (GHSA-qr28-fpjm-wq7f)
//   - node-forge 1.4.0 -> 1.4.1 (GHSA-8hrf-8g6f-7xwp, GHSA-hqq3-7jhf-c5jx,
//     GHSA-jc66-7q78-782g, GHSA-7wch-p9px-956x, GHSA-5x38-2vff-x55p)
// This test guards that the lockfile resolves the patched versions.
test('mobile lockfile resolves patched transitive deps', () => {
  const lockPath = path.join(__dirname, '..', '..', 'mobile', 'package-lock.json');
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const packages = lock.packages || {};

  const decode = packages['node_modules/decode-uri-component'];
  assert.ok(decode, 'decode-uri-component missing from mobile lockfile');
  assert.equal(
    decode.version,
    '0.5.1',
    `expected decode-uri-component 0.5.1 (GHSA-qr28-fpjm-wq7f), resolved ${decode.version}`
  );

  const forge = packages['node_modules/node-forge'];
  assert.ok(forge, 'node-forge missing from mobile lockfile');
  assert.equal(
    forge.version,
    '1.4.1',
    `expected node-forge 1.4.1 (GHSA-8hrf-8g6f-7xwp), resolved ${forge.version}`
  );
});
