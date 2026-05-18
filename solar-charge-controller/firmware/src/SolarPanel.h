#pragma once
#include <Arduino.h>

// Mirror of the wire format used by the gateway. Keep field names exactly
// the same as server/src/types/system.ts so JSON serialization matches.
enum class PanelStatus {
  ONLINE,
  OFFLINE,
  LOW_LIGHT,
  FAULT
};

const char* panelStatusToString(PanelStatus s);

class SolarPanel {
 public:
  String panelId;
  String name;
  float voltage;     // Volts
  float current;     // Amperes
  float powerWatts;  // Watts
  float temperatureC;
  PanelStatus status;

  SolarPanel();
  SolarPanel(const String& id, const String& displayName,
             float v, float a, float t);

  // Advance simulated values by one tick. TODO(real-hw): replace with
  // ADC reads on dedicated voltage-divider + current-shunt channels.
  void tick();
};
