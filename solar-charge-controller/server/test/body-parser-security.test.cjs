'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

// The gateway parses JSON request bodies with body-parser. Versions
// <= 1.20.5 are vulnerable to a denial of service
// (GHSA-27r3-jxmh-p828). The project pins body-parser to 2.x as the
// fix, and index.ts parses request bodies with that direct dependency.
// This test guards that the module resolved from the server's own
// dependency graph is the patched major version, not the vulnerable
// 1.20.5 that express 4 bundles internally.
test('gateway resolves body-parser >= 2.4.0 (GHSA-27r3-jxmh-p828)', () => {
  const pkg = require('body-parser/package.json');
  const major = Number(pkg.version.split('.')[0]);

  assert.ok(
    major >= 2,
    `expected body-parser 2.x, resolved ${pkg.version} ` +
      '(1.20.5 is vulnerable to GHSA-27r3-jxmh-p828)'
  );
});
