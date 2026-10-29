import { RGBA, TextAttributes } from "@opentui/core"
import { For, type JSX } from "solid-js"
import { useTerminalDimensions } from "@opentui/solid"
import { useTheme } from "../context/theme"
import { tint } from "../theme/color"
import { habakiri, go } from "../logo"

// Blue gradient for the HABAKIRI wordmark (top -> bottom).
const HABAKIRI_GRADIENT = [
  "#93c5fd",
  "#7dd3fc",
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  "#1e3a8a",
  "#172554",
  "#0f172a",
]

export function Logo() {
  const theme = useTheme()
  const dimensions = useTerminalDimensions()

  const gradientColor = (index: number): RGBA => {
    const hex = HABAKIRI_GRADIENT[Math.min(index, HABAKIRI_GRADIENT.length - 1)]
    return RGBA.fromHex(hex)
  }

  const renderLine = (line: string, fg: RGBA): JSX.Element[] => {
    return Array.from(line).map((char) => (
      <text fg={fg} selectable={false}>
        {char === " " ? " " : char}
      </text>
    ))
  }

  return (
    <box flexDirection="column">
      {dimensions().width < 60 ? (
        <For each={habakiri}>
          {(line, index) => (
            <box flexDirection="row">{renderLine(line, gradientColor(index()))}</box>
          )}
        </For>
      ) : (
        <For each={habakiri}>
          {(line, index) => (
            <box flexDirection="row">{renderLine(line, gradientColor(index()))}</box>
          )}
        </For>
      )}
      <box flexDirection="row" paddingTop={1}>
        <text fg={theme.text.muted} selectable={false}>
          opencode
        </text>
      </box>
    </box>
  )
}
