import { Plugin } from "@opencode/plugin"

const SECRET_PATTERNS: RegExp[] = [
  /AKIA[0-9A-Z]{16}/,
  /sk-[A-Za-z0-9]{20,}/,
  /ghp_[A-Za-z0-9]{36}/,
  /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /password\s*[:=]\s*["'][^"']+["']/i,
  /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
  /token\s*[:=]\s*["'][^"']+["']/i,
]

const EXFIL_PATTERNS: RegExp[] = [
  /\bcurl\b[^\n]*(-d|--data|--data-binary|-F|--form)\b/,
  /\bwget\b[^\n]*--post/,
]

export default Plugin.define({
  id: "egress-guard",
  async setup(ctx) {
    await ctx.tool.hook("execute.before", async (event) => {
      const blob = JSON.stringify(event.input ?? {})
      for (const p of SECRET_PATTERNS) {
        if (p.test(blob)) {
          throw new Error("egress-guard: secret-like content detected in tool args; refusing execution")
        }
      }
      if (event.tool === "bash" || event.tool === "shell") {
        const cmd = String((event.input as any)?.command ?? "")
        for (const p of EXFIL_PATTERNS) {
          if (p.test(cmd)) {
            throw new Error("egress-guard: potential exfiltration command blocked")
          }
        }
      }
    })
  },
})
