// ---------------------------------------------------------------------------
// SolarCharge Controller — ESP32 bench/simulator firmware
// ---------------------------------------------------------------------------
// This firmware imitates a small solar+battery controller for the
// purpose of integrating with the SolarCharge gateway and mobile app.
// It generates plausible telemetry, polls the gateway for charge-target
// commands, validates them locally, and reports the outcome.
//
// SAFETY NOTE: This firmware is NOT for real solar/battery hardware.
// It does not drive any high-voltage actuators. The TODO comments
// throughout mark the points where a real product would integrate
// certified hardware drivers (BMS, contactors, charge controllers,
// fuses, watchdogs, etc).
// ---------------------------------------------------------------------------

#include <Arduino.h>
#include <WiFi.h>

#include "config.h"
#include "BatteryCluster.h"
#include "SolarPanel.h"
#include "SafetyManager.h"
#include "TelemetryManager.h"
#include "CommandManager.h"

// In-memory simulated system state. Sized to match the gateway seed.
static SolarPanel    panels[NUM_PANELS];
static BatteryCluster batteries[NUM_BATTERIES];
static String activeChargingClusterId = "battery-1";
static bool   systemFault = false;

// Timers.
static unsigned long lastTelemetryAt = 0;
static unsigned long lastCommandPollAt = 0;

static void seedDevices() {
  // Match server/src/data/mockSystem.ts.
  panels[0] = SolarPanel("panel-1", "Panel 1", 38.4f, 7.3f, 32.0f);
  panels[1] = SolarPanel("panel-2", "Panel 2", 38.6f, 8.0f, 33.0f);
  panels[2] = SolarPanel("panel-3", "Panel 3", 38.1f, 6.6f, 31.0f);
  panels[3] = SolarPanel("panel-4", "Panel 4", 38.5f, 7.5f, 32.0f);

  batteries[0] = BatteryCluster("battery-1", "Battery Cluster 1", 72.0f, 48.2f, 10.0f, 96.0f);
  batteries[1] = BatteryCluster("battery-2", "Battery Cluster 2", 41.0f, 47.8f, 10.0f, 94.0f);
  batteries[2] = BatteryCluster("battery-3", "Battery Cluster 3", 88.0f, 49.1f,  8.0f, 92.0f);
  batteries[3] = BatteryCluster("battery-4", "Battery Cluster 4", 25.0f, 47.1f, 12.0f, 95.0f);

  // Boot with battery-1 charging to match the gateway seed.
  batteries[0].status = BatteryStatus::CHARGING;
  batteries[0].isCurrentlyCharging = true;
  batteries[0].current = 12.0f;
}

static const char* systemStatusString() {
  if (systemFault) return "fault";
  return "normal";
}

static void connectWifi() {
  Serial.printf("[WIFI] Connecting to '%s'…\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED &&
         millis() - start < WIFI_CONNECT_TIMEOUT_MS) {
    delay(250);
    Serial.print('.');
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WIFI] Connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    // Don't reboot — let the loop keep retrying telemetry. A real
    // product would have a state machine + watchdog here.
    Serial.println("[WIFI] Connection failed; will keep retrying in loop.");
  }
}

// LED blink to indicate the active cluster changed. Keeps the LED off
// otherwise to make the change more visible at a glance.
static void flashStatusLed() {
  for (int i = 0; i < 4; ++i) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    delay(80);
    digitalWrite(STATUS_LED_PIN, LOW);
    delay(80);
  }
}

// Apply an accepted SET_CHARGE_TARGET locally. TODO(real-hw): replace
// the in-memory mutation with a sequence of contactor/precharge/relay
// operations gated by a hardware interlock.
static void applyChargeTarget(const String& clusterId) {
  for (int i = 0; i < NUM_BATTERIES; ++i) {
    if (batteries[i].clusterId == clusterId) {
      batteries[i].status = BatteryStatus::CHARGING;
      batteries[i].isCurrentlyCharging = true;
    } else if (batteries[i].status != BatteryStatus::FAULT &&
               batteries[i].status != BatteryStatus::OFFLINE &&
               batteries[i].status != BatteryStatus::FULL) {
      batteries[i].status = BatteryStatus::IDLE;
      batteries[i].isCurrentlyCharging = false;
      batteries[i].current = 0.0f;
    } else {
      batteries[i].isCurrentlyCharging = false;
    }
  }
  activeChargingClusterId = clusterId;
  flashStatusLed();
}

static void handleCommand(const PendingCommand& cmd) {
  if (cmd.type != DeviceCommandType::SET_CHARGE_TARGET) {
    Serial.println("[COMMAND] Unknown command type — rejecting.");
    CommandManager::reportResult(cmd.commandId, false, "Unknown command",
                                 SafetyReasonCode::CLUSTER_NOT_FOUND, "");
    return;
  }

  Serial.print("[COMMAND] Received SET_CHARGE_TARGET ");
  Serial.println(cmd.clusterId);

  SafetyDecision decision = SafetyManager::evaluateChargeTarget(
      batteries, NUM_BATTERIES, panels, NUM_PANELS, cmd.clusterId,
      activeChargingClusterId, systemFault);

  if (!decision.ok) {
    Serial.print("[SAFETY] Rejected: ");
    Serial.println(decision.message);
    CommandManager::reportResult(cmd.commandId, false, decision.message,
                                 decision.reasonCode, "");
    Serial.println("[COMMAND] Result sent to backend");
    return;
  }

  Serial.println("[SAFETY] Command accepted");
  applyChargeTarget(cmd.clusterId);
  Serial.print("[CONTROL] Active charging cluster changed to ");
  Serial.println(activeChargingClusterId);

  CommandManager::reportResult(cmd.commandId, true,
                               "Charge target switched to " + cmd.clusterId,
                               SafetyReasonCode::OK,
                               activeChargingClusterId);
  Serial.println("[COMMAND] Result sent to backend");
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.printf("[BOOT] SolarCharge Controller firmware v%s\n", FIRMWARE_VERSION);
  Serial.printf("[BOOT] Device ID: %s\n", DEVICE_ID);
  Serial.printf("[BOOT] Backend: %s\n", BACKEND_BASE_URL);

  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  randomSeed(analogRead(0));
  seedDevices();
  connectWifi();
}

void loop() {
  // Lightweight reconnect attempt if Wi-Fi drops.
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastReconnectAt = 0;
    if (millis() - lastReconnectAt > 5000) {
      lastReconnectAt = millis();
      Serial.println("[WIFI] Reconnecting…");
      WiFi.reconnect();
    }
    delay(50);
    return;
  }

  // Tick all simulated devices once per main loop pass. This is cheap.
  for (int i = 0; i < NUM_PANELS; ++i) panels[i].tick();
  for (int i = 0; i < NUM_BATTERIES; ++i) {
    batteries[i].tick(batteries[i].clusterId == activeChargingClusterId,
                      systemFault);
  }

  unsigned long now = millis();

  if (now - lastTelemetryAt >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryAt = now;
    bool ok = TelemetryManager::sendTelemetry(
        panels, NUM_PANELS, batteries, NUM_BATTERIES,
        activeChargingClusterId, systemStatusString());
    if (ok) Serial.println("[TELEMETRY] Sent system telemetry");
    else    Serial.println("[TELEMETRY] Send failed (will retry next tick)");
  }

  if (now - lastCommandPollAt >= COMMAND_POLL_INTERVAL_MS) {
    lastCommandPollAt = now;
    PendingCommand cmd = CommandManager::poll();
    if (cmd.present) handleCommand(cmd);
  }

  // Yield. Keep this small — millis()-based timers above drive the real
  // cadence, and anything longer hurts responsiveness for a future
  // command poll.
  delay(20);
}
