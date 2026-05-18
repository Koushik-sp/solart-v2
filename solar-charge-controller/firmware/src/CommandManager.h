#pragma once
#include <Arduino.h>
#include "SafetyManager.h"

enum class DeviceCommandType {
  NONE,
  SET_CHARGE_TARGET
};

struct PendingCommand {
  bool present;
  String commandId;
  DeviceCommandType type;
  String clusterId;
};

// Handles polling the gateway for commands and posting back results.
// All HTTP work is synchronous — the polling interval (config.h) keeps
// it cheap, and async would complicate the loop without buying us much.
class CommandManager {
 public:
  // Polls /api/device/command. Returns a PendingCommand with
  // present=false when there is nothing to do.
  static PendingCommand poll();

  // Reports the outcome of a command back to the gateway.
  static bool reportResult(const String& commandId, bool accepted,
                           const String& message,
                           SafetyReasonCode reasonCode,
                           const String& activeChargingClusterId);
};
