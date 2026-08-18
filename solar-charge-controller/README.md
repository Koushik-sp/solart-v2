# SolarCharge Controller (MVP)

A simulator-first MVP for a solar + multi-battery-cluster energy system,
with two account types: an **Admin** who controls and monitors the
system, and an **investor User** who holds simulated shares and earns
simulated "Project Credits". Three layers:

| Layer       | Stack                            | Role                                                  |
| ----------- | -------------------------------- | ----------------------------------------------------- |
| `mobile/`   | React Native + Expo + TypeScript | iPhone app — login, admin control + investor views    |
| `server/`   | Node.js + Express + TypeScript   | Mock gateway — auth, system state, finance simulation |
| `firmware/` | ESP32 + PlatformIO + C++         | Bench/simulator firmware — telemetry + commands       |

> **This is an MVP simulation only.** There is no real authentication,
> no real payment processing, no real cryptocurrency, no token minting,
> no securities, and no real government energy-sale integration. See
> [Why this is simulation-only](#why-this-is-simulation-only).

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
│       ├── auth/AuthContext.tsx
│       ├── components/{BatteryCard, PanelCard, StatusBadge,
│       │                ConfirmSwitchModal, StatCard, RoleHeader,
│       │                EarningsCard, CreditConversionCard,
│       │                TransactionCard, InvestPreviewCard,
│       │                ConfirmInvestmentModal}.tsx
│       ├── navigation/{AppNavigator, AdminTabs, UserTabs}.tsx
│       ├── screens/
│       │   ├── LoginScreen.tsx
│       │   ├── admin/Admin{Dashboard, Batteries, Logs, Settings,
│       │   │                ProjectFinance}Screen.tsx
│       │   └── user/User{Dashboard, BatteryStatus, Earnings,
│       │                  Transactions, Invest}Screen.tsx
│       ├── theme/colors.ts
│       ├── types/{system, auth, finance}.ts
│       └── utils/formatting.ts
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── data/{mockSystem, mockUsers, mockFinance,
│       │          mockTransactions}.ts
│       ├── routes/{auth, system, control, sim, device, project,
│       │            user}Routes.ts
│       ├── services/{auth, finance, userPortfolio, simulation,
│       │              validation, event, command}Service.ts
│       └── types/{system, auth, finance}.ts
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

### Auth

| Method | Path              | Description                                  |
| ------ | ----------------- | -------------------------------------------- |
| `POST` | `/api/auth/login` | `{ username, password }` → user + demo token |

Demo-only login. On success returns `{ success: true, user, token }`;
on bad credentials returns `401` with
`{ success: false, message: "Invalid username or password" }`. The token
is a fixed demo string (`demo-admin-token` / `demo-user-token`), not a
JWT.

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

`/api/sim/reset` also restores the simulated project finance and
transaction history to their seed values.

### Project & investor (Project Credits)

| Method | Path                                  | Description                                  |
| ------ | ------------------------------------- | -------------------------------------------- |
| `GET`  | `/api/project/finance`                | Simulated project finance snapshot           |
| `POST` | `/api/project/simulate-energy-sale`   | `{ energySoldKWh, pricePerKWhUSD? }` (admin) |
| `GET`  | `/api/users/:userId/portfolio`        | A user's shares, credits, USD value          |
| `GET`  | `/api/users/:userId/transactions`     | A user's simulated transaction history       |
| `POST` | `/api/users/:userId/buy-shares`       | `{ sharesToBuy }` — simulated share purchase |

`grossRevenueUSD` and `userRewardPoolUSD` are always computed in code
from the stored parameters — they are never stored directly. Auth is
demo-level, so `simulate-energy-sale` is not access-controlled at the
HTTP layer; in the product only an admin would reach it.

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

## Demo logins

The app opens on a login screen. There is **no real authentication** —
it is a simple local/session-based login for the MVP, with two
hardcoded demo accounts:

| Account | Username | Password | Lands on        |
| ------- | -------- | -------- | --------------- |
| Admin   | `admin`  | `admin`  | Admin Dashboard |
| User    | `user`   | `user`   | User Dashboard  |

The logged-in role is held in app state (`mobile/src/auth/AuthContext.tsx`)
and drives routing. Both roles have a **Log out** button in the header
of every screen. Login state is session-only — it is not persisted, so
restarting the app returns you to the login screen.

---

## Admin vs User features

The app has two account types. The role determines which tab navigator
is mounted, so a user can never reach an admin screen and vice versa.

### Admin — system operator

Five tabs (`navigation/AdminTabs.tsx`):

- **Dashboard** — full solar/battery dashboard, telemetry, system status.
- **Batteries** — full control, including **Charge This Cluster** buttons.
- **Logs** — all system, control, device, and energy-sale events.
- **Finance** — read-only Project Finance, plus a Simulate Energy Sale
  control.
- **Settings** — operating mode, fault simulation, reset, logout.

### User — investor / shareholder

The user is an investor in the solar project. They **cannot** control
the solar or battery system. Five tabs (`navigation/UserTabs.tsx`),
all read-only except the simulated Invest flow:

- **Dashboard** — welcome, active charging cluster, solar power, system
  status, energy sold, a summary of their credits/USD/shares, and an
  *Invest More* shortcut to the Invest tab.
- **Batteries** — read-only battery cluster cards (no control buttons).
- **Earnings** — shares, ownership, the earnings formula, and the
  Project Credit conversion card.
- **Transactions** — simulated earnings/transaction history.
- **Invest** — buy more simulated project shares (see
  [Simulated share investing](#simulated-share-investing)).

The user role cannot switch the charge target, simulate or clear
faults, reset the simulation, change operating mode, or open any admin
settings / firmware controls — those screens are not mounted for the
user role at all.

---

## Project Credits system

The app uses a **simulated proprietary monetary unit** called
**Project Credits**.

> **Project Credits are simulated MVP credits. They are not real money,
> not cryptocurrency, not securities, and cannot be withdrawn.**

The conversion rate is a fixed display constant:

```
1 Project Credit      = $0.01 USD
100 Project Credits   = $1.00 USD
1,000 Project Credits = $10.00 USD
10,000 Project Credits= $100.00 USD
```

Users hold simulated **shares** of the project and earn Project Credits
from the project's simulated energy sales.

### Earnings formula

The solar project "sells" energy in the simulation. A user earns a
slice of the revenue proportional to the shares they own — they do
**not** get the whole reward pool unless they own 100% of the shares.

```
grossRevenueUSD      = totalEnergySoldKWh * pricePerKWhUSD
userRewardPoolUSD    = grossRevenueUSD * (rewardPercentToUsers / 100)
userOwnershipPercent = userOwnedShares / totalProjectShares
userEarningsUSD      = userRewardPoolUSD * userOwnershipPercent
userEarnedCredits    = userEarningsUSD / creditConversionRateUSD
                     = userEarningsUSD * 100      (since 1 credit = $0.01)
```

With the seed values (`totalEnergySoldKWh = 12,450`,
`pricePerKWhUSD = 0.12`, `rewardPercentToUsers = 15`,
`totalProjectShares = 1,000`, demo user `ownedShares = 100`):

```
grossRevenueUSD      = 12,450 * 0.12 = $1,494.00
userRewardPoolUSD    = 1,494 * 0.15  = $224.10
userOwnershipPercent = 100 / 1,000   = 10%
userEarningsUSD      = 224.10 * 0.10 = $22.41
userEarnedCredits    = 22.41 / 0.01  = 2,241 credits
```

All monetary values are computed in code (`services/financeService.ts`
and `services/userPortfolioService.ts`) — never hardcoded. USD is
rounded to 2 decimals; credits are rounded to whole credits.

### Simulated share investing

The user **Invest** tab lets an investor buy more simulated project
shares. This is **simulation-only** — it updates mock in-memory data and
nothing else.

- **Share price:** 1 project share = **$10.00** simulated USD
  (`sharePriceUSD`, fixed for the MVP).
- Buying shares **increases the demo user's owned shares** and their
  running `userTotalSimulatedInvestedUSD`. It does **not** increase
  `totalProjectShares` — that stays fixed at 1,000.
- A user can buy at most `availableShares = totalProjectShares -
  ownedShares` (900 at the seed state). `sharesToBuy` must be a positive
  whole number; decimals, zero, negatives, non-numeric input, and
  amounts above the available shares are all rejected.
- Each purchase appends a `SHARE_PURCHASE` transaction with `credits: 0`
  and a **negative** `usdValue` (the simulated cost, e.g. `-50.00` for
  5 shares).
- After a purchase the user's ownership percent and earnings
  recalculate from the same formula above — buying 5 shares moves the
  demo user from 100 → 105 shares, 10% → 10.5% ownership, and
  2,241 → 2,353 Project Credits ($22.41 → $23.53).

The flow: enter a whole number of shares → review the live preview
(cost, new ownership, new estimated reward) → tap **Buy Shares** →
confirm in the **Confirm Simulated Investment** modal → the backend
validates and updates the portfolio. `POST /api/users/:userId/buy-shares`
returns the updated portfolio + the new transaction, or a structured
failure (`reasonCode: "INSUFFICIENT_AVAILABLE_SHARES"` /
`"INVALID_SHARES_AMOUNT"`).

**No real payment processing exists.** There is no Stripe, Plaid,
Apple Pay, crypto wallet, bank account, or checkout of any kind. No
real money is charged, and no real ownership, securities, equity,
tokens, or payouts are created — only mock in-memory data changes.

---

## Why this is simulation-only

This is an MVP **simulation**. It deliberately does **not** include, and
must not be connected to:

- Real authentication — login is hardcoded demo accounts, no JWT, no
  hashing, no identity provider.
- Real payment processing, banks, wallets, or payment processors.
- Real cryptocurrency or token minting — "Project Credits" are an
  in-app accounting unit only.
- Real securities or investment instruments — "shares" are a simulation
  construct with no legal or financial meaning.
- Real government energy-sale integration — energy sales are simulated
  numbers.
- Real high-voltage hardware — see the safety disclaimer at the top.

Project Credits cannot be bought, sold, withdrawn, or exchanged.

---

## Demo script

### How to test the admin flow

1. Start the backend (`cd server && npm run dev`).
2. Start the mobile app (`cd mobile && npm start`, then `i` for the
   iOS Simulator or scan with Expo Go).
3. On the login screen, sign in with **`admin` / `admin`**. You land on
   the **Admin Dashboard**.
4. Review live solar power, the active cluster (Battery 1), all four
   batteries, and all four panels.
5. Open the **Batteries** tab and tap **CHARGE THIS CLUSTER** on
   Battery 2. Confirm in the modal — the dashboard updates.
6. Open **Logs** — you'll see a `CHARGE_TARGET_CHANGED` event.
7. Open the **Finance** tab — review the simulated Project Finance and
   the demo investor's portfolio.
8. In **Finance**, use **Simulate Energy Sale** (e.g. 100 kWh at
   $0.12/kWh). Revenue recalculates and a new reward transaction is
   created for the demo investor.
9. Open **Settings** → **Simulate fault**, then try a switch — the
   gateway rejects it with `SYSTEM_FAULT`. **Clear fault** to recover.

### How to test the user flow

1. From the admin side, tap **Log out** in any header.
2. Sign in with **`user` / `user`**. You land on the **User Dashboard**
   (labelled *Investor View*).
3. Review the read-only solar and system status, then open the
   **Batteries** tab — battery cluster cards appear with **no control
   buttons**.
4. Open **Earnings** — see owned shares (100), ownership (10%), the
   earnings formula, **2,241 Project Credits**, and an estimated value
   of **$22.41**, plus the credit conversion card.
5. Open the **Invest** tab (or tap *Invest More* on the Dashboard).
   Enter `5` shares — the preview shows a $50.00 simulated cost and
   ownership rising 10% → 10.5%.
6. Tap **Buy Shares**, review the **Confirm Simulated Investment**
   modal, and confirm. A success alert appears.
7. Return to **Earnings** — ownership is now 10.5% and the balance has
   recalculated to **2,353 Project Credits** ($23.53).
8. Open **Transactions** — the new `SHARE_PURCHASE` row shows
   `+5 shares` and a `-$50.00` simulated cost.
9. Confirm there is no way to switch charging, simulate faults, or
   reach admin settings — those tabs and controls do not exist for the
   user role.

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
