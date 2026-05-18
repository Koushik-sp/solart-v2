# SolarCharge Controller (MVP)

A simulator-first MVP for managing a solar + multi-battery-cluster energy
system from an iPhone. Three layers:

| Layer       | Stack                            | Role                                            |
| ----------- | -------------------------------- | ----------------------------------------------- |
| `mobile/`   | React Native + Expo + TypeScript | iPhone app — view system, switch charge target  |
| `server/`   | Node.js + Express + TypeScript   | Mock gateway — system state, safety validation  |
| `firmware/` | ESP32 + PlatformIO + C++         | Bench/simulator firmware — telemetry + commands |

## ⚠️ Safety disclaimer (read this first)

This project is an **MVP / bench-test simulator**.

- The firmware does **not** drive any real high-voltage actuators —
  it simulates panel and battery values and (optionally) toggles a
  status LED.
- The mobile app and gateway only mutate in-memory state and JSON over
  HTTP. Nothing connects to a real BMS, contactor, charge controller,
  fuse, or battery system.
- Every "switch charge target" command goes through **two layers** of
  safety validation (gateway + firmware) — but neither layer is a
  substitute for certified hardware safety, electrical compliance
  review, or professional engineering.

Do **not** wire this firmware to live solar/battery hardware. See
[Future hardware integration](#future-hardware-integration) below for
what a real product would need.

---

## Architecture overview

```
              ┌──────────────────────┐
              │  iPhone — Expo app   │
              │  (mobile/)           │
              └─────────┬────────────┘
                        │ HTTP polling (2s)
                        ▼
              ┌──────────────────────┐
              │  Mock Gateway        │
              │  Node + Express      │
              │  (server/)           │
              └─────────┬────────────┘
                        │ HTTP telemetry + command poll
                        ▼
              ┌──────────────────────┐
              │  ESP32 firmware      │   simulator
              │  (firmware/)         │   (optional)
              └──────────────────────┘
```

The gateway has two modes:

1. **Simulation-only**: when no firmware telemetry has been received in
   the last 6 s, the gateway runs its own simulation tick every 2 s.
2. **Device-connected**: when the ESP32 is reporting telemetry, the
   gateway uses the device payloads as the system state and stops its
   internal simulation.

Charge target switches always validate on the gateway. When a device is
connected, the gateway also forwards the command to the firmware, which
validates again locally before applying.

---

## Project structure

```
solar-charge-controller/
├── README.md
├── mobile/
│   ├── App.tsx
│   ├── app.json
│   ├── babel.config.js
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── api/{client.ts, config.ts}
│       ├── components/{BatteryCard, PanelCard, StatusBadge,
│       │                ConfirmSwitchModal, StatCard}.tsx
│       ├── navigation/AppNavigator.tsx
│       ├── screens/{Dashboard, Batteries, Logs, Settings}Screen.tsx
│       ├── theme/colors.ts
│       ├── types/system.ts
│       └── utils/formatting.ts
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── data/mockSystem.ts
│       ├── routes/{system, control, sim, device}Routes.ts
│       ├── services/{simulation, validation, event, command}Service.ts
│       └── types/system.ts
└── firmware/
    ├── platformio.ini
    └── src/
        ├── main.cpp
        ├── config.h
        ├── BatteryCluster.{h,cpp}
        ├── SolarPanel.{h,cpp}
        ├── SafetyManager.{h,cpp}
        ├── TelemetryManager.{h,cpp}
        └── CommandManager.{h,cpp}
```

---

## Setup

### 1. Backend (mock gateway)

Requires Node 18+.

```bash
cd server
npm install
npm run dev          # ts-node-dev, hot-reload
# or:
npm run build && npm start
```

The gateway listens on `http://localhost:4000` by default. Set `PORT`
to override.

Quick health check:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/system/status | jq
```

### 2. Mobile app (iPhone)

Requires Node 18+, the Expo CLI (bundled), and Expo Go on your phone
(or the iOS Simulator).

```bash
cd mobile
npm install
npm start            # opens the Expo dev server
```

Then either:

- Press `i` to launch the iOS Simulator, **or**
- Open Expo Go on your iPhone and scan the QR code.

#### Using a physical iPhone

`localhost` on your phone refers to the phone, not your laptop. Edit
[`mobile/src/api/config.ts`](mobile/src/api/config.ts):

```ts
export const API_BASE_URL = "http://192.168.1.42:4000"; // your laptop's LAN IP
```

Find your laptop's IP:

```bash
ipconfig getifaddr en0   # macOS Wi-Fi
```

Make sure the phone and laptop are on the same Wi-Fi network and that
nothing on your laptop is firewalling port 4000.

### 3. ESP32 firmware (optional)

The mobile app + gateway demo work without the firmware — the gateway
falls back to simulation mode. You only need this layer to demo the
firmware-side safety validation and round-trip command flow.

1. Install [VS Code](https://code.visualstudio.com/) and the
   [PlatformIO IDE extension](https://platformio.org/install/ide?install=vscode).
2. Open the `firmware/` folder in VS Code (PlatformIO recognises
   `platformio.ini`).
3. Edit [`firmware/src/config.h`](firmware/src/config.h):
   - Set `WIFI_SSID` / `WIFI_PASSWORD`.
   - Set `BACKEND_BASE_URL` to your laptop's LAN IP, e.g.
     `"http://192.168.1.42:4000"`.
4. Plug in an ESP32 dev board over USB.
5. PlatformIO toolbar → **Upload** (`PlatformIO: Upload`).
6. PlatformIO toolbar → **Serial Monitor** (115200 baud).
7. Watch boot logs:

   ```
   [BOOT] SolarCharge Controller firmware v0.1.0
   [WIFI] Connected. IP: 192.168.1.55
   [TELEMETRY] Sent system telemetry
   ```

8. With the backend already running, the gateway's
   `GET /api/system/status` will now flip `deviceConnected: true`,
   and the mobile app's Dashboard will show **ESP32 ONLINE**.

---

## API reference (gateway)

All endpoints return JSON. CORS is enabled.

### System

| Method | Path                  | Description                           |
| ------ | --------------------- | ------------------------------------- |
| `GET`  | `/health`             | `{ ok: true }`                        |
| `GET`  | `/api/system/status`  | Full system snapshot + recommendation |
| `GET`  | `/api/panels`         | All solar panels                      |
| `GET`  | `/api/batteries`      | All battery clusters + active + recommendation |
| `GET`  | `/api/events?limit=N` | Recent system events (newest first)   |

### Control

| Method | Path                          | Description                              |
| ------ | ----------------------------- | ---------------------------------------- |
| `POST` | `/api/control/charge-target`  | `{ clusterId, requestedBy }` → switch    |
| `POST` | `/api/control/mode`           | `{ mode: "auto" \| "manual" }`           |

### Simulation

| Method | Path                       | Description                  |
| ------ | -------------------------- | ---------------------------- |
| `POST` | `/api/sim/reset`           | Reset to seed state          |
| `POST` | `/api/sim/fault`           | Inject a system fault        |
| `POST` | `/api/sim/clear-fault`     | Clear the simulated fault    |

### Device (firmware ↔ gateway)

| Method | Path                                   | Description                          |
| ------ | -------------------------------------- | ------------------------------------ |
| `POST` | `/api/device/telemetry`                | Firmware reports current state       |
| `GET`  | `/api/device/command?deviceId=...`     | Firmware polls for pending command   |
| `POST` | `/api/device/command-result`           | Firmware reports command outcome     |

---

## Safety validation

The same eight rules are evaluated on **both** the gateway
([`server/src/services/validationService.ts`](server/src/services/validationService.ts))
**and** the firmware
([`firmware/src/SafetyManager.cpp`](firmware/src/SafetyManager.cpp)).
This is intentional defense-in-depth — neither layer is allowed to be
the sole gate.

A switch is rejected if any of the following are true:

| Check                                        | Reason code                  |
| -------------------------------------------- | ---------------------------- |
| Cluster does not exist                       | `CLUSTER_NOT_FOUND`          |
| `systemStatus === "fault"`                   | `SYSTEM_FAULT`               |
| Cluster status is `fault` or `offline`       | `CLUSTER_FAULT_OR_OFFLINE`   |
| Temperature > 45 °C                          | `BATTERY_TEMP_HIGH`          |
| State of charge ≥ 95 %                       | `BATTERY_SOC_HIGH`           |
| Health < 60 %                                | `BATTERY_HEALTH_LOW`         |
| Total solar power < 100 W                    | `SOLAR_POWER_LOW`            |
| Cluster is already the active charge target  | `ALREADY_CHARGING`           |

Thresholds live in one place per layer
(`SAFETY` constants in `validationService.ts`,
`SAFETY_*` macros in `firmware/src/config.h`). Update both when you
change a limit.

---

## Demo script

1. Start the backend (`cd server && npm run dev`).
2. Start the mobile app (`cd mobile && npm start`, then `i` for the
   iOS Simulator or scan with Expo Go).
3. Open the **Dashboard** tab — see live solar power, the active
   cluster (Battery 1), all four batteries, all four panels.
4. Switch to the **Batteries** tab. Battery 4 is recommended (lowest
   SOC).
5. Tap **CHARGE THIS CLUSTER** on Battery 2. The confirm modal shows
   the safety snapshot for Battery 2 and warns that auto mode will
   switch to manual.
6. Confirm. The dashboard updates — Battery 2 is now charging.
7. Open the **Logs** tab. You'll see a `CHARGE_TARGET_CHANGED` event.
8. Open **Settings** → **Simulate fault**. System status flips to
   FAULT and Battery 3 is marked faulty.
9. Try to switch to Battery 3 from the Batteries tab — the button is
   disabled. Try Battery 4: the gateway rejects with
   `SYSTEM_FAULT`.
10. The Logs tab shows a `CHARGE_TARGET_REJECTED` event with the
    reason code.
11. Settings → **Clear fault**, then retry the switch — it succeeds.

### With the ESP32 connected

Repeat steps 1–11 with the firmware running and connected to the same
Wi-Fi as your laptop. In the Serial Monitor you'll see:

```
[COMMAND] Received SET_CHARGE_TARGET battery-2
[SAFETY] Command accepted
[CONTROL] Active charging cluster changed to battery-2
[COMMAND] Result sent to backend
```

Inject a fault, then try a switch — the firmware rejects locally
(after the gateway has already accepted, this is the second layer):

```
[COMMAND] Received SET_CHARGE_TARGET battery-4
[SAFETY] Rejected: System is in fault state
[COMMAND] Result sent to backend
```

(In practice, when both layers know the system is faulted, the gateway
rejects first.)

---

## Future hardware integration

This MVP would need substantial additional work to become a real
product. At minimum:

- **Charge controller / EMS gateway**: certified MPPT or hybrid
  inverter integration via Modbus / CAN / proprietary protocol.
- **BMS communication**: SOC, cell voltages, cell balancing, fault
  flags must come from a real BMS — never inferred from pack voltage.
- **Contactor / relay control**: cluster switching is implemented as
  precharge → main contactor sequencing on certified contactor
  drivers, never bare GPIO into a relay module.
- **Hardware interlocks**: physical interlocks that prevent cluster
  contactor closure under unsafe conditions, independent of firmware.
- **Overcurrent protection**: per-cluster fuses, breakers, and
  current-limiting hardware sized to fault levels.
- **Thermal monitoring**: per-cluster thermistors plus enclosure-level
  thermal cutout.
- **Authentication**: signed device identity (X.509 or similar),
  mutual TLS to the gateway, no anonymous device telemetry.
- **Encrypted communication**: TLS end-to-end. The MVP uses plaintext
  HTTP because it lives on a trusted LAN for development.
- **Audit logs**: append-only, signed, persisted off-device.
- **Fail-safe defaults**: power loss / firmware crash must drive
  contactors to a known-safe state (open).
- **Manual emergency disconnect**: physical e-stop independent of the
  controller MCU.
- **Watchdog + brownout**: hardware watchdog timers, brownout
  detection, recovery to fail-safe state.
- **Secure boot + signed updates**: rotating keys, rollback protection.
- **Compliance**: relevant electrical and safety standards
  (UL 9540 / IEC 62619 / NEC 706 etc., depending on jurisdiction).
- **Professional engineering review**: PE-stamped electrical design
  + enclosure / thermal validation.

The TODOs scattered through `firmware/src/*.cpp` mark the hooks where
the real drivers would replace simulated values.

---

## License

MIT (see source).
