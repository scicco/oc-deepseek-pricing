import { describe, expect, test } from "bun:test"

import { formatDuration, getPricingSnapshot } from "./pricing.js"

const COVERED_YEARS = new Set([2026])

function snapshotAt(iso: string, holidays: ReadonlySet<string> = new Set()) {
  return getPricingSnapshot(new Date(iso), {
    chinesePublicHolidays: holidays,
    coveredHolidayYears: COVERED_YEARS,
  })
}

function stateAt(iso: string) {
  return snapshotAt(iso).state
}

describe("pricing windows", () => {
  test("handles both weekday peak windows", () => {
    expect(stateAt("2026-10-26T00:59:59Z")).toBe("off-peak")
    expect(stateAt("2026-10-26T01:00:00Z")).toBe("peak")
    expect(stateAt("2026-10-26T04:00:00Z")).toBe("off-peak")
    expect(stateAt("2026-10-26T06:00:00Z")).toBe("peak")
    expect(stateAt("2026-10-26T10:00:00Z")).toBe("off-peak")
  })

  test("keeps weekends off-peak", () => {
    const saturday = snapshotAt("2026-10-24T02:00:00Z")
    const sunday = snapshotAt("2026-10-25T07:00:00Z")

    expect(saturday.state).toBe("off-peak")
    expect(saturday.reason).toBe("weekend")

    expect(sunday.state).toBe("off-peak")
    expect(sunday.reason).toBe("weekend")
  })

  test("marks ordinary weekday hours outside the windows as off-peak", () => {
    const snapshot = snapshotAt("2026-10-26T05:00:00Z")

    expect(snapshot.state).toBe("off-peak")
    expect(snapshot.reason).toBe("outside-peak-window")
    expect(snapshot.rateMultiplier).toBe(0.5)
  })

  test("uses the full multiplier during peak hours", () => {
    const snapshot = snapshotAt("2026-10-26T08:00:00Z")

    expect(snapshot.state).toBe("peak")
    expect(snapshot.reason).toBe("peak-window")
    expect(snapshot.rateMultiplier).toBe(1)
  })
})

describe("Chinese public holidays", () => {
  test("overrides a weekday peak window", () => {
    const snapshot = snapshotAt("2026-10-01T02:00:00Z", new Set(["2026-10-01"]))

    expect(snapshot.state).toBe("off-peak")
    expect(snapshot.reason).toBe("chinese-public-holiday")
    expect(snapshot.rateMultiplier).toBe(0.5)
  })

  test("reports whether the Chinese calendar year is covered", () => {
    expect(snapshotAt("2026-10-27T12:00:00Z").holidayCalendarCovered).toBe(true)

    const uncovered = getPricingSnapshot(new Date("2027-01-05T12:00:00Z"), {
      chinesePublicHolidays: new Set(),
      coveredHolidayYears: COVERED_YEARS,
    })

    expect(uncovered.holidayCalendarCovered).toBe(false)
  })
})

describe("next transition", () => {
  test("finds the end of the first peak window", () => {
    const snapshot = snapshotAt("2026-10-27T02:15:00Z")

    expect(snapshot.nextState).toBe("off-peak")
    expect(snapshot.nextTransition).toBe("2026-10-27T04:00:00.000Z")
    expect(snapshot.secondsUntilTransition).toBe(6_300)
  })

  test("finds the beginning of the second peak window", () => {
    const snapshot = snapshotAt("2026-10-27T05:30:00Z")

    expect(snapshot.nextState).toBe("peak")
    expect(snapshot.nextTransition).toBe("2026-10-27T06:00:00.000Z")
    expect(snapshot.secondsUntilTransition).toBe(1_800)
  })

  test("skips the weekend when finding the next peak window", () => {
    const snapshot = snapshotAt("2026-10-30T10:00:00Z")

    expect(snapshot.state).toBe("off-peak")
    expect(snapshot.nextState).toBe("peak")
    expect(snapshot.nextTransition).toBe("2026-11-02T01:00:00.000Z")
  })
})

describe("duration formatting", () => {
  test("formats minutes and hours", () => {
    expect(formatDuration(60)).toBe("1m")
    expect(formatDuration(3_600)).toBe("1h")
    expect(formatDuration(5_400)).toBe("1h 30m")
  })

  test("rounds partial minutes up", () => {
    expect(formatDuration(1)).toBe("1m")
    expect(formatDuration(61)).toBe("2m")
  })
})

describe("input validation", () => {
  test("rejects invalid dates", () => {
    expect(() => {
      getPricingSnapshot(new Date("invalid"))
    }).toThrow("Invalid date")
  })
})
