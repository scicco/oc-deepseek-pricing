// Official public-holiday periods published by the General Office of the
// State Council of the People's Republic of China.
//
// Dates use the Asia/Shanghai calendar and ISO YYYY-MM-DD format.
// Compensatory working weekends are intentionally not listed: DeepSeek's
// pricing rule explicitly treats all Saturdays and Sundays as off-peak.
export const CHINESE_PUBLIC_HOLIDAYS = new Set<string>([
  // 2026 New Year's Day: January 1-3
  "2026-01-01",
  "2026-01-02",
  "2026-01-03",

  // 2026 Spring Festival: February 15-23
  "2026-02-15",
  "2026-02-16",
  "2026-02-17",
  "2026-02-18",
  "2026-02-19",
  "2026-02-20",
  "2026-02-21",
  "2026-02-22",
  "2026-02-23",

  // 2026 Qingming Festival: April 4-6
  "2026-04-04",
  "2026-04-05",
  "2026-04-06",

  // 2026 Labor Day: May 1-5
  "2026-05-01",
  "2026-05-02",
  "2026-05-03",
  "2026-05-04",
  "2026-05-05",

  // 2026 Dragon Boat Festival: June 19-21
  "2026-06-19",
  "2026-06-20",
  "2026-06-21",

  // 2026 Mid-Autumn Festival: September 25-27
  "2026-09-25",
  "2026-09-26",
  "2026-09-27",

  // 2026 National Day: October 1-7
  "2026-10-01",
  "2026-10-02",
  "2026-10-03",
  "2026-10-04",
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
])

export const COVERED_HOLIDAY_YEARS = new Set<number>([2026])
