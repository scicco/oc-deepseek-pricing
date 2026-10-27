export type PricingState = "peak" | "off-peak"
export type PricingReason =
  | "peak-window"
  | "outside-peak-window"
  | "weekend"
  | "chinese-public-holiday"

export interface PricingSnapshot {
  state: PricingState
  rateMultiplier: 1 | 0.5
  reason: PricingReason
  now: string
  nextTransition: string
  nextState: PricingState
  secondsUntilTransition: number
  holidayCalendarCovered: boolean
  chinaDate: string
}

export interface PricingOptions {
  chinesePublicHolidays?: ReadonlySet<string>
  coveredHolidayYears?: ReadonlySet<number>
}

const PEAK_WINDOWS = [
  { startHour: 1, endHour: 4 },
  { startHour: 6, endHour: 10 },
] as const
const CHINA_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

function chinaDate(date: Date): string {
  return CHINA_DATE_FORMATTER.format(date)
}
function isWeekday(date: Date): boolean {
  const day = date.getUTCDay()
  return day >= 1 && day <= 5
}
function isInsidePeakWindow(date: Date): boolean {
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  return PEAK_WINDOWS.some(({ startHour, endHour }) => hour >= startHour && hour < endHour)
}
function classify(
  date: Date,
  holidays: ReadonlySet<string>,
): { state: PricingState; reason: PricingReason } {
  if (holidays.has(chinaDate(date))) return { state: "off-peak", reason: "chinese-public-holiday" }
  if (!isWeekday(date)) return { state: "off-peak", reason: "weekend" }
  if (isInsidePeakWindow(date)) return { state: "peak", reason: "peak-window" }
  return { state: "off-peak", reason: "outside-peak-window" }
}
function nextTransition(date: Date, holidays: ReadonlySet<string>): Date {
  const current = classify(date, holidays).state
  const cursor = new Date(date)
  cursor.setUTCMilliseconds(0)
  cursor.setUTCSeconds(0)
  cursor.setUTCMinutes(0)
  if (cursor.getTime() <= date.getTime()) cursor.setUTCHours(cursor.getUTCHours() + 1)
  for (let i = 0; i < 24 * 14; i += 1) {
    if (classify(cursor, holidays).state !== current) return cursor
    cursor.setUTCHours(cursor.getUTCHours() + 1)
  }
  throw new Error("Unable to find the next DeepSeek pricing transition within 14 days")
}
export function getPricingSnapshot(
  date = new Date(),
  options: PricingOptions = {},
): PricingSnapshot {
  if (Number.isNaN(date.getTime())) throw new TypeError("Invalid date")
  const holidays = options.chinesePublicHolidays ?? new Set<string>()
  const coveredYears = options.coveredHolidayYears ?? new Set<number>()
  const current = classify(date, holidays)
  const transition = nextTransition(date, holidays)
  const chinaDay = chinaDate(date)
  return {
    state: current.state,
    rateMultiplier: current.state === "peak" ? 1 : 0.5,
    reason: current.reason,
    now: date.toISOString(),
    nextTransition: transition.toISOString(),
    nextState: current.state === "peak" ? "off-peak" : "peak",
    secondsUntilTransition: Math.max(0, Math.ceil((transition.getTime() - date.getTime()) / 1000)),
    holidayCalendarCovered: coveredYears.has(Number(chinaDay.slice(0, 4))),
    chinaDate: chinaDay,
  }
}
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.max(0, Math.ceil(totalSeconds / 60))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}
