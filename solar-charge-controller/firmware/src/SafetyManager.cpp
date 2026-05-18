#include "SafetyManager.h"
#include "config.h"

const char* safetyReasonCodeToString(SafetyReasonCode code) {
  switch (code) {
    case SafetyReasonCode::OK:                       return "OK";
    case SafetyReasonCode::CLUSTER_NOT_FOUND:        return "CLUSTER_NOT_FOUND";
    case SafetyReasonCode::CLUSTER_FAULT_OR_OFFLINE: return "CLUSTER_FAULT_OR_OFFLINE";
    case SafetyReasonCode::BATTERY_TEMP_HIGH:        return "BATTERY_TEMP_HIGH";
    case SafetyReasonCode::BATTERY_SOC_HIGH:         return "BATTERY_SOC_HIGH";
    case SafetyReasonCode::BATTERY_HEALTH_LOW:       return "BATTERY_HEALTH_LOW";
    case SafetyReasonCode::SYSTEM_FAULT:             return "SYSTEM_FAULT";
    case SafetyReasonCode::SOLAR_POWER_LOW:          return "SOLAR_POWER_LOW";
    case SafetyReasonCode::ALREADY_CHARGING:         return "ALREADY_CHARGING";
  }
  return "OK";
}

SafetyDecision SafetyManager::evaluateChargeTarget(
    BatteryCluster* batteries, int batteryCount,
    SolarPanel* panels, int panelCount,
    const String& targetClusterId,
    const String& currentChargingClusterId,
    bool systemFault) {
  SafetyDecision d;
  d.ok = false;

  // Find the target.
  BatteryCluster* target = nullptr;
  for (int i = 0; i < batteryCount; ++i) {
    if (batteries[i].clusterId == targetClusterId) {
      target = &batteries[i];
      break;
    }
  }
  if (target == nullptr) {
    d.reasonCode = SafetyReasonCode::CLUSTER_NOT_FOUND;
    d.message = "Cluster not found: " + targetClusterId;
    return d;
  }

  if (systemFault) {
    d.reasonCode = SafetyReasonCode::SYSTEM_FAULT;
    d.message = "System is in fault state";
    return d;
  }

  if (target->status == BatteryStatus::FAULT ||
      target->status == BatteryStatus::OFFLINE) {
    d.reasonCode = SafetyReasonCode::CLUSTER_FAULT_OR_OFFLINE;
    d.message = "Cluster is fault/offline";
    return d;
  }

  if (target->temperatureC > SAFETY_MAX_BATTERY_TEMP_C) {
    d.reasonCode = SafetyReasonCode::BATTERY_TEMP_HIGH;
    d.message = "Battery temperature too high";
    return d;
  }

  if (target->stateOfChargePercent >= SAFETY_MAX_BATTERY_SOC_PCT) {
    d.reasonCode = SafetyReasonCode::BATTERY_SOC_HIGH;
    d.message = "Battery SOC too high";
    return d;
  }

  if (target->healthPercent < SAFETY_MIN_BATTERY_HEALTH_PCT) {
    d.reasonCode = SafetyReasonCode::BATTERY_HEALTH_LOW;
    d.message = "Battery health too low";
    return d;
  }

  // Total solar power across all panels.
  float totalSolar = 0.0f;
  for (int i = 0; i < panelCount; ++i) totalSolar += panels[i].powerWatts;
  if (totalSolar < SAFETY_MIN_SOLAR_POWER_W) {
    d.reasonCode = SafetyReasonCode::SOLAR_POWER_LOW;
    d.message = "Solar power too low";
    return d;
  }

  if (target->isCurrentlyCharging ||
      currentChargingClusterId == targetClusterId) {
    d.reasonCode = SafetyReasonCode::ALREADY_CHARGING;
    d.message = "Cluster is already charging";
    return d;
  }

  d.ok = true;
  d.reasonCode = SafetyReasonCode::OK;
  d.message = "Accepted";
  return d;
}
