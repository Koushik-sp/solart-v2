#include "SolarPanel.h"

const char* panelStatusToString(PanelStatus s) {
  switch (s) {
    case PanelStatus::ONLINE:    return "online";
    case PanelStatus::OFFLINE:   return "offline";
    case PanelStatus::LOW_LIGHT: return "low_light";
    case PanelStatus::FAULT:     return "fault";
  }
  return "offline";
}

static float jitter(float center, float magnitude) {
  // random returns 0..1, recentered to -1..1.
  float r = (random(0, 10001) / 10000.0f) * 2.0f - 1.0f;
  return center + r * magnitude;
}

static float clampF(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

SolarPanel::SolarPanel()
    : panelId(""),
      name(""),
      voltage(0),
      current(0),
      powerWatts(0),
      temperatureC(25),
      status(PanelStatus::ONLINE) {}

SolarPanel::SolarPanel(const String& id, const String& displayName,
                       float v, float a, float t)
    : panelId(id),
      name(displayName),
      voltage(v),
      current(a),
      powerWatts(v * a),
      temperatureC(t),
      status(PanelStatus::ONLINE) {}

void SolarPanel::tick() {
  // TODO(real-hw): read voltage from ADC channel + voltage divider,
  //                current from a current-shunt + INA219 (or similar),
  //                temperature from a 1-wire sensor on the panel.
  if (status == PanelStatus::OFFLINE || status == PanelStatus::FAULT) {
    current = 0;
    powerWatts = 0;
    return;
  }
  voltage = clampF(jitter(voltage, 0.4f), 30.0f, 42.0f);
  float baseCurrent = (status == PanelStatus::LOW_LIGHT) ? 2.0f : 7.5f;
  current = clampF(jitter(baseCurrent, 0.6f), 0.0f, 12.0f);
  powerWatts = clampF(voltage * current, 0.0f, 600.0f);
  temperatureC = clampF(jitter(temperatureC, 0.3f), 15.0f, 65.0f);
}
