#pragma once
#include <Arduino.h>
#include "BatteryCluster.h"
#include "SolarPanel.h"

// Reason codes returned to the gateway when the firmware refuses a
// command. Strings match server/src/types/system.ts SafetyReasonCode.
enum class SafetyReasonCode {
  OK,
  CLUSTER_NOT_FOUND,
  CLUSTER_FAULT_OR_OFFLINE,
  BATTERY_TEMP_HIGH,
  BATTERY_SOC_HIGH,
  BATTERY_HEALTH_LOW,
  SYSTEM_FAULT,
  SOLAR_POWER_LOW,
  ALREADY_CHARGING
};

const char* safetyReasonCodeToString(SafetyReasonCode code);

struct SafetyDecision {
  bool ok;
  SafetyReasonCode reasonCode;
  String message;
};

// ---------------------------------------------------------------------------
// SafetyManager
// ---------------------------------------------------------------------------
// Independent local validation of charge-target switch commands. The
// gateway already validates, but the firmware must validate again
// (defense-in-depth) — neither layer is allowed to be the sole gate.
//
// All thresholds come from config.h. Update both this and
// server/src/services/validationService.ts when limits change.
// ---------------------------------------------------------------------------
class SafetyManager {
 public:
  static SafetyDecision evaluateChargeTarget(
      BatteryCluster* batteries, int batteryCount,
      SolarPanel* panels, int panelCount,
      const String& targetClusterId,
      const String& currentChargingClusterId,
      bool systemFault);
};
