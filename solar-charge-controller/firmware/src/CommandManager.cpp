#include "CommandManager.h"
#include "config.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>

PendingCommand CommandManager::poll() {
  PendingCommand cmd;
  cmd.present = false;
  cmd.type = DeviceCommandType::NONE;

  HTTPClient http;
  String url =
      String(BACKEND_BASE_URL) + "/api/device/command?deviceId=" + DEVICE_ID;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(url)) return cmd;

  int code = http.GET();
  if (code != 200) {
    http.end();
    return cmd;
  }
  String body = http.getString();
  http.end();

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    Serial.print("[COMMAND] Failed to parse poll response: ");
    Serial.println(err.c_str());
    return cmd;
  }
  bool hasCommand = doc["hasCommand"] | false;
  if (!hasCommand) return cmd;

  cmd.present = true;
  cmd.commandId = String((const char*)(doc["commandId"] | ""));
  String typeStr = String((const char*)(doc["type"] | ""));
  if (typeStr == "SET_CHARGE_TARGET") {
    cmd.type = DeviceCommandType::SET_CHARGE_TARGET;
  }
  cmd.clusterId = String((const char*)(doc["clusterId"] | ""));
  return cmd;
}

bool CommandManager::reportResult(const String& commandId, bool accepted,
                                  const String& message,
                                  SafetyReasonCode reasonCode,
                                  const String& activeChargingClusterId) {
  JsonDocument doc;
  doc["deviceId"] = DEVICE_ID;
  doc["commandId"] = commandId;
  doc["accepted"] = accepted;
  doc["message"] = message;
  if (!accepted) {
    doc["reasonCode"] = safetyReasonCodeToString(reasonCode);
  }
  if (accepted && activeChargingClusterId.length() > 0) {
    doc["activeChargingClusterId"] = activeChargingClusterId;
  }

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + "/api/device/command-result";
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(url)) return false;
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  bool ok = (code >= 200 && code < 300);
  http.end();
  return ok;
}
