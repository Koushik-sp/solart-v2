#pragma once

// ---------------------------------------------------------------------------
// SolarCharge firmware configuration
// ---------------------------------------------------------------------------
// Edit the placeholders below before flashing. Nothing in this file is
// secret-safe — for a real product, credentials would live in NVS, be
// provisioned over BLE, or use signed manifests. This is bench-test
// firmware only (see safety notes in README.md).
// ---------------------------------------------------------------------------

// --- Wi-Fi -----------------------------------------------------------------
#define WIFI_SSID       "YOUR_WIFI_NAME"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// --- Backend gateway -------------------------------------------------------
// Use the LAN IP of the machine running the Node backend. Do NOT use
// "localhost" — the ESP32 isn't on the same loopback as your laptop.
// On macOS: `ipconfig getifaddr en0` (Wi-Fi) gives you the right value.
#define BACKEND_BASE_URL  "http://192.168.1.100:4000"

// --- Device identity -------------------------------------------------------
#define DEVICE_ID         "esp32-solar-controller-001"
#define FIRMWARE_VERSION  "0.1.0"

// --- Timing ----------------------------------------------------------------
#define TELEMETRY_INTERVAL_MS  2000
#define COMMAND_POLL_INTERVAL_MS 1000
#define WIFI_CONNECT_TIMEOUT_MS 20000
#define HTTP_TIMEOUT_MS         3000

// --- Safety thresholds (mirror server/src/services/validationService.ts) ----
// Keep these in sync with the gateway. Defense-in-depth: both layers
// reject independently so neither a bad gateway nor a bad mobile build
// can drive the device into an unsafe state.
#define SAFETY_MAX_BATTERY_TEMP_C   45.0f
#define SAFETY_MAX_BATTERY_SOC_PCT  95.0f
#define SAFETY_MIN_BATTERY_HEALTH_PCT 60.0f
#define SAFETY_MIN_SOLAR_POWER_W    100.0f

// --- Counts (must match server seed) ---------------------------------------
#define NUM_PANELS        4
#define NUM_BATTERIES     4

// --- Status LED pin --------------------------------------------------------
// On a typical ESP32 dev board pin 2 drives the on-board blue LED.
// We blink it when the active charging cluster changes. For a richer
// indicator, wire WS2812 LEDs to a free GPIO and replace this constant.
// TODO(real-hw): For a production product, replace this with the
// status indicator driver (e.g. an RGB LED on a dedicated PWM channel).
#define STATUS_LED_PIN    2
