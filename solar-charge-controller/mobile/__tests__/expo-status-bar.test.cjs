const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const mobileDir = path.resolve(__dirname, "..");
const readJson = (name) =>
  JSON.parse(fs.readFileSync(path.join(mobileDir, name), "utf8"));

test("expo-status-bar is pinned to the 58.0.5 release", () => {
  const pkg = readJson("package.json");
  const lock = readJson("package-lock.json");

  const spec = pkg.dependencies["expo-status-bar"];
  assert.match(
    spec,
    /58\.0\.5/,
    "package.json should depend on expo-status-bar 58.0.5",
  );

  const rootSpec = lock.packages[""].dependencies["expo-status-bar"];
  assert.equal(
    rootSpec,
    spec,
    "lockfile root dependency should match package.json",
  );

  const entry = lock.packages["node_modules/expo-status-bar"];
  assert.ok(entry, "expo-status-bar should be present in the lockfile");
  assert.equal(entry.version, "58.0.5");
  assert.match(
    entry.resolved,
    /expo-status-bar-58\.0\.5\.tgz$/,
    "lockfile should resolve expo-status-bar 58.0.5",
  );
});

test("App does not use status bar APIs removed or deprecated by expo-status-bar", () => {
  const app = fs.readFileSync(path.join(mobileDir, "App.tsx"), "utf8");

  for (const removed of [
    "setStatusBarNetworkActivityIndicatorVisible",
    "setStatusBarBackgroundColor",
    "setStatusBarTranslucent",
  ]) {
    assert.ok(!app.includes(removed), `App.tsx must not call ${removed}`);
  }

  assert.ok(
    !/<StatusBar[^>]*(?:backgroundColor|translucent)\s*=/.test(app),
    "StatusBar must not use the deprecated background/translucency props",
  );
});
