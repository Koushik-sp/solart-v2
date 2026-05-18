#include "BatteryCluster.h"

const char* batteryStatusToString(BatteryStatus s) {
  switch (s) {
    case BatteryStatus::IDLE:        return "idle";
    case BatteryStatus::CHARGING:    return "charging";
    case BatteryStatus::DISCHARGING: return "discharging";
    case BatteryStatus::FULL:        return "full";
    case BatteryStatus::FAULT:       return "fault";
    case BatteryStatus::OFFLINE:     return "offline";
  }
  return "offline";
}

static float jitter(float center, float magnitude) {
  float r = (random(0, 10001) / 10000.0f) * 2.0f - 1.0f;
  return center + r * magnitude;
}

static float clampF(float v, float lo, float hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

BatteryCluster::BatteryCluster()
    : clusterId(""),
      name(""),
      stateOfChargePercent(0),
      voltage(48.0f),
      current(0),
      capacityKWh(10),
      temperatureC(25),
      healthPercent(100),
      status(BatteryStatus::IDLE),
      isCurrentlyCharging(false),
      lastUpdated(0) {}

BatteryCluster::BatteryCluster(const String& id, const String& displayName,
                               float socPct, float v, float capKWh,
                               float health)
    : clusterId(id),
      name(displayName),
      stateOfChargePercent(socPct),
      voltage(v),
      current(0),
      capacityKWh(capKWh),
      temperatureC(27),
      healthPercent(health),
      status(BatteryStatus::IDLE),
      isCurrentlyCharging(false),
      lastUpdated(0) {}

void BatteryCluster::tick(bool isActiveTarget, bool systemFault) {
  // TODO(real-hw): replace simulated values with reads from a real BMS
  // over CAN/RS485/Modbus. SOC must come from the BMS, never inferred
  // from voltage alone.
  lastUpdated = millis();

  if (status == BatteryStatus::FAULT || status == BatteryStatus::OFFLINE) {
    current = 0;
    isCurrentlyCharging = false;
    return;
  }

  if (systemFault) {
    status = BatteryStatus::IDLE;
    current = 0;
    isCurrentlyCharging = false;
    return;
  }

  if (isActiveTarget) {
    if (stateOfChargePercent >= 100.0f) {
      stateOfChargePercent = 100.0f;
      status = BatteryStatus::FULL;
      current = 0;
      isCurrentlyCharging = false;
    } else {
      // Slow climb so demos look realistic without finishing in seconds.
      stateOfChargePercent =
          clampF(stateOfChargePercent + 0.05f + (random(0, 1001) / 10000.0f),
                 0.0f, 100.0f);
      current = clampF(jitter(12.0f, 1.0f), 8.0f, 16.0f);
      temperatureC = clampF(temperatureC + 0.05f + (random(0, 501) / 10000.0f),
                            15.0f, 60.0f);
      status = BatteryStatus::CHARGING;
      isCurrentlyCharging = true;
    }
  } else {
    current = clampF(jitter(0.0f, 0.2f), -0.5f, 0.5f);
    if (status != BatteryStatus::FULL) status = BatteryStatus::IDLE;
    isCurrentlyCharging = false;
    if (temperatureC > 25.0f) temperatureC -= 0.05f;
    else if (temperatureC < 25.0f) temperatureC += 0.02f;
    if (status != BatteryStatus::FULL) {
      stateOfChargePercent =
          clampF(stateOfChargePercent - 0.005f, 0.0f, 100.0f);
    }
  }
}
