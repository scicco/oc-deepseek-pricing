# Updating the Chinese Public-Holiday Calendar

`oc-deepseek-pricing` treats Chinese public holidays as fully off-peak days. The holiday calendar is deliberately maintained as versioned source code so that pricing decisions remain deterministic, reviewable, and independent of a runtime network request.

## When to update the calendar

Update the calendar after the competent Chinese authorities publish the official public-holiday schedule for the next calendar year.

Do not predict dates from previous years. Some holidays follow the lunar calendar, and the official schedule may include arrangements that vary from year to year.

The plugin needs the dates that DeepSeek considers **Chinese public holidays**. It does not need ordinary weekends or compensatory working days unless DeepSeek explicitly changes its pricing policy to treat them differently.

## Source requirements

Use an official Chinese government publication as the primary source. Record the source URL and the date on which you consulted it in the pull request or commit message.

Before updating the calendar:

1. Verify that the announcement applies to the intended calendar year.
2. Verify every holiday interval, including inclusive start and end dates.
3. Distinguish public holidays from compensatory working weekends.
4. Check DeepSeek's current pricing documentation for any change to its holiday definition.
5. Do not copy dates from an unofficial calendar without checking them against the official announcement.

## File to edit

Edit:

```text
src/holidays.ts
```

The file exports two sets:

```ts
export const CHINESE_PUBLIC_HOLIDAYS = new Set<string>([])
export const COVERED_HOLIDAY_YEARS = new Set<number>([])
```

Add every public-holiday date individually in ISO `YYYY-MM-DD` format:

```ts
export const CHINESE_PUBLIC_HOLIDAYS = new Set<string>(["2027-01-01", "2027-02-06", "2027-02-07"])

export const COVERED_HOLIDAY_YEARS = new Set<number>([2027])
```

The example dates above illustrate the required format only. They must not be treated as an official 2027 calendar.

## Date and timezone semantics

Holiday dates are interpreted as calendar dates in:

```text
Asia/Shanghai
```

This is important near UTC day boundaries. A timestamp may belong to one date in UTC and to the following date in China.

Rules:

- Store dates as `YYYY-MM-DD` strings.
- Do not store timestamps.
- Do not convert the published dates to UTC before adding them.
- Keep the list sorted in ascending order.
- Include each date only once.
- Include all dates in a multi-day public-holiday interval.

## Compensatory working days

Chinese holiday announcements may designate some Saturdays or Sundays as working days to compensate for extended holiday periods.

Under the current DeepSeek pricing rule, weekends are off-peak in full. Therefore, do not turn a compensatory working weekend into a peak day unless DeepSeek's own pricing documentation explicitly says that compensatory working days follow weekday peak pricing.

The plugin's pricing rules should follow DeepSeek's billing policy, not the general Chinese business calendar.

## Updating an existing calendar

Preserve previously covered years unless there is a documented correction. This allows historical timestamps and tests to remain reproducible.

For example:

```ts
export const COVERED_HOLIDAY_YEARS = new Set<number>([2026, 2027])
```

Do not add a year to `COVERED_HOLIDAY_YEARS` until all official public-holiday dates for that year have been entered and reviewed.

## Validation checklist

Before committing the update, verify all of the following:

- [ ] The primary source is an official government publication.
- [ ] The announcement refers to the intended year.
- [ ] Every public-holiday date is present.
- [ ] Multi-day ranges include both their start and end dates.
- [ ] Compensatory working days have not been mistaken for holidays.
- [ ] Dates are formatted as `YYYY-MM-DD`.
- [ ] Dates are sorted and contain no duplicates.
- [ ] The year is listed in `COVERED_HOLIDAY_YEARS` only after the calendar is complete.
- [ ] DeepSeek's pricing page still states that Chinese public holidays are off-peak in full.
- [ ] Existing tests pass.
- [ ] New holiday-boundary tests have been added for the updated year.

## Tests to add

At minimum, add tests for:

1. A weekday timestamp inside a normal peak window on a listed holiday. It must be off-peak.
2. A timestamp immediately before the holiday starts in `Asia/Shanghai`.
3. A timestamp at the beginning of the holiday in `Asia/Shanghai`.
4. A timestamp immediately after the holiday ends in `Asia/Shanghai`.
5. A normal weekday peak timestamp outside the holiday interval. It must remain peak.

Example test shape:

```ts
test("Chinese public holiday overrides a weekday peak window", () => {
  const value = getPricingSnapshot(new Date("YYYY-MM-DDTHH:mm:ssZ"), {
    chinesePublicHolidays: new Set(["YYYY-MM-DD"]),
    coveredHolidayYears: new Set([YYYY]),
  })

  expect(value.state).toBe("off-peak")
  expect(value.reason).toBe("chinese-public-holiday")
})
```

Replace all placeholders with verified values for the year being added.

Run:

```sh
bun test
bun run check
```

## Suggested commit message

```text
chore(calendar): add verified Chinese public holidays for YYYY
```

## Suggested pull-request notes

Include:

```text
Calendar year: YYYY
Official source: <URL>
Source consulted on: YYYY-MM-DD
DeepSeek pricing policy checked on: YYYY-MM-DD
Compensatory working days excluded: yes/no
Tests added or updated: <summary>
```

## Failure policy

If the official calendar for a year is unavailable or cannot be verified:

- leave that year out of `COVERED_HOLIDAY_YEARS`;
- do not add guessed holiday dates;
- keep the runtime warning enabled;
- document the missing coverage in the issue tracker.

A visible coverage warning is safer than silently applying an unverified billing classification.
