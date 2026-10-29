/// <reference path="../env.d.ts" />
import type { Plugin } from "@opencode-ai/plugin"

const PHASE_TEMPERATURE: Record<string, number> = {
  triage: 0.2,
  audit: 0.3,
  exploit: 0.4,
  verify: 0.1,
}

function classifyPhase(agent: string | undefined, text: string): string {
  const a = (agent ?? "").toLowerCase()
  if (a === "triage" || a === "audit" || a === "exploit" || a === "verify" || a === "report") return a
  const t = text.toLowerCase()
  if (/\b(final|submit|weaponize|chain)\b/.test(t)) return "exploit"
  if (/\b(crash|triage|sort|summarize|log)\b/.test(t)) return "triage"
  return "audit"
}

export default (async function orcaRouter(input, options) {
  return {
    "chat.message": async (hookInput, output) => {
      const text = output.parts.map((p: any) => (typeof p?.text === "string" ? p.text : "")).join(" ")
      const phase = classifyPhase(hookInput.agent, text)
      // record phase on message metadata if possible (best-effort)
      try {
        ;(output.message as any).habakiri_phase = phase
      } catch {}
    },
    "chat.params": async (hookInput, output) => {
      const phase = classifyPhase(hookInput.agent, "")
      const temp = PHASE_TEMPERATURE[phase]
      if (temp !== undefined) output.temperature = temp
    },
    "experimental.session.compacting": async (_input, output) => {
      output.context.push(
        "HABAKIRI compaction: preserve confirmed vulnerability locations (file, function, address, offset), " +
          "established primitives, verified PoC paths and oracles, failed approaches and their causes, " +
          "and the list of unverified hypotheses.",
      )
    },
    "event": async (hookInput) => {
      // local audit logging only; no external send
      // (kept minimal; full JSONL logging is a Phase 2 item)
    },
  }
}) as any
