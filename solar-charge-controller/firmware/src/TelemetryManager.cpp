#include "TelemetryManager.h"
#include "config.h"
#include <HTTPClient.h>
#include <ArduinoJson.h>

bool TelemetryManager::sendTelemetry(SolarPanel* panels, int panelCount,
                                     BatteryCluster* batteries,
                                     int batteryCount,
                                     const String& activeChargingClusterId,
                                     const char* systemStatus) {
  // Build JSON. Sized generously: 4 panels + 4 batteries with all
  // fields plus envelope. JsonDocument auto-grows on ArduinoJson v7.
  JsonDocument doc;
  doc["deviceId"] = DEVICE_ID;
  doc["timestamp"] = (uint32_t)(millis());
  doc["activeChargingClusterId"] =
      activeChargingClusterId.length() ? activeChargingClusterId : (const char*)nullptr;
  doc["systemStatus"] = systemStatus;
  doc["firmwareVersion"] = FIRMWARE_VERSION;

  JsonArray panelArr = doc["panels"].to<JsonArray>();
  for (int i = 0; i < panelCount; ++i) {
    JsonObject p = panelArr.add<JsonObject>();
    p["panelId"]      = panels[i].panelId;
    p["name"]         = panels[i].name;
    p["voltage"]      = panels[i].voltage;
    p["current"]      = panels[i].current;
    p["powerWatts"]   = panels[i].powerWatts;
    p["status"]       = panelStatusToString(panels[i].status);
    p["temperatureC"] = panels[i].temperatureC;
  }

  JsonArray battArr = doc["batteries"].to<JsonArray>();
  for (int i = 0; i < batteryCount; ++i) {
    JsonObject b = battArr.add<JsonObject>();
    b["clusterId"]            = batteries[i].clusterId;
    b["name"]                 = batteries[i].name;
    b["stateOfChargePercent"] = batteries[i].stateOfChargePercent;
    b["voltage"]              = batteries[i].voltage;
    b["current"]              = batteries[i].current;
    b["capacityKWh"]          = batteries[i].capacityKWh;
    b["temperatureC"]         = batteries[i].temperatureC;
    b["status"]               = batteryStatusToString(batteries[i].status);
    b["isCurrentlyCharging"]  = batteries[i].isCurrentlyCharging;
    b["healthPercent"]        = batteries[i].healthPercent;
    b["lastUpdated"]          = (uint32_t)batteries[i].lastUpdated;
  }

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  String url = String(BACKEND_BASE_URL) + "/api/device/telemetry";
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(url)) return false;
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(body);
  bool ok = (code >= 200 && code < 300);
  http.end();
  return ok;
}
