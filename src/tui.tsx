/** @jsxImportSource @opentui/solid */

import { Plugin } from "@opencode/plugin/tui"
import { createSignal } from "solid-js"
import { CHINESE_PUBLIC_HOLIDAYS, COVERED_HOLIDAY_YEARS } from "./holidays.js"
import {
  formatDuration,
  getPricingSnapshot,
  type PricingReason,
  type PricingSnapshot,
  type PricingState,
} from "./pricing.js"

function createSnapshot(): PricingSnapshot {
  return getPricingSnapshot(new Date(), {
    chinesePublicHolidays: CHINESE_PUBLIC_HOLIDAYS,
    coveredHolidayYears: COVERED_HOLIDAY_YEARS,
  })
}

function stateLabel(state: PricingState): string {
  return state === "peak" ? "🐳 peak" : "🐋💤 off-peak"
}

function stateName(state: PricingState): string {
  return state === "peak" ? "peak" : "off-peak"
}

function StateLabel(props: { state: PricingState }) {
  if (props.state === "peak") {
    return <text>🐳 peak</text>
  }

  return (
    <box flexDirection="row">
      <text>🐋💤 </text>
      <text fg="gray">off-peak</text>
    </box>
  )
}

function reasonLabel(reason: PricingReason): string {
  switch (reason) {
    case "peak-window":
      return "weekday peak window"
    case "outside-peak-window":
      return "outside peak windows"
    case "weekend":
      return "weekend"
    case "chinese-public-holiday":
      return "Chinese public holiday"
  }
}

function formatLocalTransition(snapshot: PricingSnapshot): string {
  return new Date(snapshot.nextTransition).toLocaleString()
}

function isDeepSeekSelected(
  model:
    | {
        readonly providerID: string
        readonly modelID: string
        readonly variant?: string
      }
    | undefined,
): boolean {
  return model?.modelID.toLowerCase().includes("deepseek") ?? false
}

export default Plugin.define({
  id: "oc-deepseek-pricing",

  setup(ctx) {
    const [snapshot, setSnapshot] = createSignal(createSnapshot())

    let transitionTimer: ReturnType<typeof setTimeout> | undefined
    let minuteTimer: ReturnType<typeof setInterval> | undefined

    const refresh = (): PricingSnapshot => {
      const updated = createSnapshot()
      setSnapshot(updated)
      return updated
    }

    const scheduleTransition = (): void => {
      if (transitionTimer !== undefined) {
        clearTimeout(transitionTimer)
      }

      const current = snapshot()
      const delay = Math.max(1_000, current.secondsUntilTransition * 1_000 + 250)

      transitionTimer = setTimeout(() => {
        refresh()
        scheduleTransition()
      }, delay)
    }

    const showStatus = (): void => {
      const current = refresh()

      const lines = [
        `Status ${stateLabel(current.state)}`,
        `Reason ${reasonLabel(current.reason)}`,
        `Next ${stateName(current.nextState)} in ${formatDuration(current.secondsUntilTransition)}`,
        `At ${formatLocalTransition(current)}`,
        `China ${current.chinaDate}`,
      ]

      if (!current.holidayCalendarCovered) {
        lines.push("Warning: Chinese holiday calendar is not configured for this year")
      }

      ctx.ui.toast.show({
        title: "DeepSeek pricing",
        message: lines.join("\n"),
        variant: current.state === "peak" ? "warning" : "success",
      })
    }

    const removePromptFooter = ctx.ui.slot({
      append: "prompt.footer.status",

      render() {
        const model = ctx.ui.model.current()

        if (!isDeepSeekSelected(model)) {
          return null
        }

        const current = snapshot()

        return (
          <box flexDirection="row">
            <StateLabel state={current.state} />
            <text>
              {" · "}
              {formatDuration(current.secondsUntilTransition)} left
            </text>
          </box>
        )
      },
    })

    const removeHomeFooter = ctx.ui.slot({
      append: "home.footer.status",

      render() {
        const model = ctx.ui.model.current()

        if (!isDeepSeekSelected(model)) {
          return null
        }

        const current = snapshot()

        return (
          <box flexDirection="row">
            <StateLabel state={current.state} />
            <text>
              {" · "}
              {formatDuration(current.secondsUntilTransition)} left
            </text>
          </box>
        )
      },
    })

    const removeSidebar = ctx.ui.slot({
      append: "sidebar.content",

      render() {
        const model = ctx.ui.model.current()

        if (!isDeepSeekSelected(model)) {
          return null
        }

        const current = snapshot()

        return (
          <box flexDirection="column">
            <box flexDirection="row">
              <text>Status </text>
              <StateLabel state={current.state} />
            </box>
            <text>{formatDuration(current.secondsUntilTransition)} left</text>
          </box>
        )
      },
    })

    ctx.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "deepseek-pricing.status",
          title: "DeepSeek pricing status",
          description: "Show the current DeepSeek peak or off-peak pricing window",
          group: "DeepSeek",
          enabled: () => isDeepSeekSelected(ctx.ui.model.current()),
          palette: true,
          slash: {
            name: "deepseek-pricing",
            aliases: ["deepseek-price"],
          },
          run: async () => {
            showStatus()
          },
        },
      ],
    }))

    minuteTimer = setInterval(() => {
      refresh()
    }, 60_000)

    scheduleTransition()

    return () => {
      if (transitionTimer !== undefined) {
        clearTimeout(transitionTimer)
      }

      if (minuteTimer !== undefined) {
        clearInterval(minuteTimer)
      }

      removePromptFooter()
      removeHomeFooter()
      removeSidebar()
    }
  },
})
