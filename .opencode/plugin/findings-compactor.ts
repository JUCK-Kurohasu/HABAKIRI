/// <reference path="../env.d.ts" />
import type { Plugin } from "@opencode-ai/plugin"

const PRESERVATION = [
  "Confirmed vulnerability locations (file, function, address, offset)",
  "Established primitives and their constraints",
  "Verified PoC paths and their oracles (success criteria)",
  "Failed approaches and their causes (dead ends)",
  "List of unverified hypotheses",
  "Target binary metadata (arch, PIE/NX/Canary/RELRO, stripped)",
  "Crash triage classifications and supporting registers",
]

export default (async function findingsCompactor(input, options) {
  return {
    "experimental.session.compacting": async (_hookInput, output) => {
      // Replace the default compaction prompt with one that forces preservation
      // of HABAKIRI's vulnerability-research findings.
      output.prompt =
        "You are compacting a HABAKIRI vulnerability-research session. " +
        "Produce a concise summary that MUST retain the following items verbatim or as structured lists:\n" +
        PRESERVATION.map((p, i) => `${i + 1}. ${p}`).join("\n") +
        "\n\nDrop verbose tool output, repeated attempts, and incidental commentary. " +
        "Keep code snippets only when they are the minimal reproduction. " +
        "Preserve exact addresses, offsets, and file paths."
      // Also ensure context carries the preservation list as a backstop.
      for (const p of PRESERVATION) output.context.push(`PRESERVE: ${p}`)
    },
  }
}) as any
