#pragma once
#include <Arduino.h>

enum class BatteryStatus {
  IDLE,
  CHARGING,
  DISCHARGING,
  FULL,
  FAULT,
  OFFLINE
};

const char* batteryStatusToString(BatteryStatus s);

class BatteryCluster {
 public:
  String clusterId;
  String name;
  float stateOfChargePercent;
  float voltage;
  float current;       // positive while charging, near 0 while idle.
  float capacityKWh;
  float temperatureC;
  float healthPercent;
  BatteryStatus status;
  bool isCurrentlyCharging;
  unsigned long lastUpdated;  // millis() timestamp

  BatteryCluster();
  BatteryCluster(const String& id, const String& displayName,
                 float socPct, float v, float capKWh, float health);

  // Advance by one tick. `isActiveTarget` is true when this cluster is
  // the active charging cluster as known by CommandManager.
  void tick(bool isActiveTarget, bool systemFault);
};
