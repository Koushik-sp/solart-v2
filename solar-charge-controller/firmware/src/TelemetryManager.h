#pragma once
#include <Arduino.h>
#include "BatteryCluster.h"
#include "SolarPanel.h"

// Sends telemetry payloads to the gateway over HTTP.
class TelemetryManager {
 public:
  // Returns true on a 2xx response from the gateway.
  static bool sendTelemetry(SolarPanel* panels, int panelCount,
                            BatteryCluster* batteries, int batteryCount,
                            const String& activeChargingClusterId,
                            const char* systemStatus);
};
