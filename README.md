# oc-deepseek-pricing

An OpenCode v2 TUI plugin that displays the current DeepSeek API pricing window in the prompt footer and session sidebar.

The indicator is intended for the direct DeepSeek provider. DeepSeek off-peak rates are half of peak rates.

## Features

- Displays the current pricing window in the prompt footer.
- Displays pricing details in the session sidebar.
- Distinguishes peak and off-peak periods.
- Shows the next pricing transition and a countdown.
- Treats weekends as fully off-peak.
- Supports Chinese public-holiday overrides.
- Warns when the holiday calendar does not cover the current Chinese calendar year.
- Uses local computation only; no network request is needed at runtime.

## Pricing schedule

Peak windows are evaluated in UTC:

- `01:00-04:00 UTC`, Monday through Friday.
- `06:00-10:00 UTC`, Monday through Friday.

All other times are off-peak, including:

- `04:00-06:00 UTC` on weekdays;
- all hours after `10:00 UTC` and before `01:00 UTC`;
- Saturdays and Sundays in full;
- Chinese public holidays in full.

The off-peak price multiplier is `0.5`.

## Requirements

- OpenCode v2 with TUI plugin support.
- Bun.
- A terminal supported by OpenCode.

Development dependencies include:

- `@opencode/plugin`;
- `@opentui/core`;
- `@opentui/solid`;
- `solid-js`;
- TypeScript.

## Repository structure

```text
oc-deepseek-pricing/
├── CALENDAR_UPDATE.md
├── README.md
├── bun.lock
├── package.json
├── src/
│   ├── holidays.ts
│   ├── pricing.test.ts
│   ├── pricing.ts
│   └── tui.tsx
└── tsconfig.json
```

## Development setup

Install dependencies:

```sh
bun install
```

Run the TypeScript check:

```sh
bun check
```

Run the test suite:

```sh
bun test
```

A successful validation should complete without TypeScript errors and with all pricing tests passing.

## OpenCode CLI configuration

Register the local TUI package in:

```text
~/.config/opencode/cli.json
```

Keep existing plugins and add `./plugins/oc-deepseek-pricing` to the `plugins` array.

Example:

```json
{
  "diffs": {
    "wrap": "word",
    "fullscreen": true
  },
  "session": {
    "sidebar": "auto",
    "scrollbar": false,
    "thinking": "hide"
  },
  "animations": true,
  "plugins": ["./herdr-opencode", "./plugins/oc-deepseek-pricing"]
}
```

Relative paths are resolved from the OpenCode configuration directory.

The package exposes its TUI entrypoint through `package.json`:

```json
{
  "exports": {
    "./tui": "./src/tui.tsx"
  }
}
```

The legacy or integration-specific `tui.jsonc` file does not need to contain this plugin when the package is loaded through `cli.json`.

## Restarting OpenCode

After changing the plugin source or configuration, close the OpenCode TUI completely and start it again.

Opening a new conversation is not necessarily sufficient because plugin entrypoints are loaded during TUI startup.

## Expected interface

When loaded, the prompt footer displays a compact indicator similar to:

```text
DeepSeek: OFF-PEAK 50% · PEAK in 11h 36m
```

During a peak window it displays a value similar to:

```text
DeepSeek: PEAK · OFF-PEAK 50% in 1h 15m
```

The session sidebar displays details similar to:

```text
DeepSeek pricing
Status OFF-PEAK 50%
Reason outside peak windows
Next PEAK in 11h 36m
At 10/28/2026, 2:00:00 AM
China 2026-10-27
```

The exact local transition time depends on the operating-system timezone and daylight-saving rules. Pricing classification itself is based on UTC, while holiday lookup uses the `Asia/Shanghai` calendar date.

## Chinese public holidays

The holiday data is stored in:

```text
src/holidays.ts
```

Only officially verified calendar years should be added to `COVERED_HOLIDAY_YEARS`.

For the full annual update procedure, source requirements, timezone rules, validation checklist, and required tests, see [CALENDAR_UPDATE.md](./CALENDAR_UPDATE.md).

If the current Chinese calendar year is not covered, the plugin continues to apply the normal UTC weekday and weekend schedule but displays a coverage warning. Do not suppress the warning by adding a year without adding and reviewing the complete official calendar.

## Tests

The test suite covers:

- the first weekday peak window;
- the off-peak gap between the two peak windows;
- the second weekday peak window;
- exact peak-window boundaries;
- weekends;
- ordinary weekday off-peak periods;
- Chinese public-holiday overrides;
- calendar-year coverage;
- next-transition calculation;
- weekend skipping when finding the next peak period;
- duration formatting;
- invalid date handling.

Run:

```sh
bun test
```

## Type checking

Run:

```sh
bun check
```

The repository uses `NodeNext` module resolution. Relative TypeScript imports must therefore use the emitted JavaScript extension, for example:

```ts
import { getPricingSnapshot } from "./pricing.js"
```
