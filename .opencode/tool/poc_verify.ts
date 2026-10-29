/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"
import path from "node:path"
import { mkdir, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"

function detectRunner(poc: string): string[] {
  const low = poc.toLowerCase()
  if (low.endsWith(".py")) return ["python3", poc]
  if (low.endsWith(".sh")) return ["bash", poc]
  if (low.endsWith(".js")) return ["node", poc]
  return [poc]
}

async function runOnce(cmd: string[], cwd: string, timeoutMs: number): Promise<{ code: number; signal?: string; stdout: string; stderr: string; timedOut: boolean }> {
  let timedOut = false
  try {
    const proc = Bun.spawn(cmd, { cwd, stdout: "pipe", stderr: "pipe" })
    const timer = setTimeout(() => { timedOut = true; proc.kill() }, timeoutMs)
    const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
    const code = await proc.exited
    clearTimeout(timer)
    // detect signal from exit code
    let signal: string | undefined
    if (code !== null && code > 128) {
      const sigs: Record<number, string> = { 130: "SIGINT", 131: "SIGQUIT", 132: "SIGILL", 133: "SIGTRAP", 134: "SIGABRT", 135: "SIGBUS", 136: "SIGFPE", 137: "SIGKILL", 138: "SIGUSR1", 139: "SIGSEGV", 141: "SIGPIPE", 143: "SIGTERM" }
      signal = sigs[code]
    }
    return { code: code ?? -1, signal, stdout, stderr, timedOut }
  } catch (e) {
    return { code: -1, stdout: "", stderr: String(e), timedOut }
  }
}

function evaluate(oracle: string, value: string, r: { code: number; signal?: string; stdout: string; stderr: string }, sandbox: string): { pass: boolean; detail: string } {
  const out = r.stdout + "\n" + r.stderr
  switch (oracle) {
    case "flag_regex": {
      try {
        const re = new RegExp(value)
        return { pass: re.test(out), detail: `regex ${value} matched: ${re.test(out)}` }
      } catch (e) {
        return { pass: false, detail: `invalid regex: ${String(e)}` }
      }
    }
    case "marker_output":
      return { pass: out.includes(value), detail: `marker "${value}" present: ${out.includes(value)}` }
    case "exit_code":
      return { pass: r.code === Number(value), detail: `exit ${r.code} === ${value}` }
    case "crash_signal": {
      if (value.toLowerCase() === "any") return { pass: !!r.signal, detail: `signal: ${r.signal ?? "none"}` }
      const want = value.toUpperCase()
      return { pass: (r.signal ?? "").toUpperCase() === want, detail: `signal ${r.signal ?? "none"} === ${want}` }
    }
    case "file_effect": {
      const p = path.isAbsolute(value) ? value : path.join(sandbox, value)
      return { pass: existsSync(p), detail: `file exists ${p}: ${existsSync(p)}` }
    }
    default:
      return { pass: false, detail: `unknown oracle ${oracle}` }
  }
}

export default tool({
  description:
    "Run a PoC in an isolated-ish working directory with a timeout and judge success by a strict oracle (flag_regex, crash_signal, marker_output, exit_code, file_effect). Records each attempt's output to .habakiri/artifacts. Network is NOT disabled by this wrapper; rely on the host environment/sandbox.",
  args: {
    poc: tool.schema.string().describe("Path to the PoC file"),
    target: tool.schema.string().optional().describe("Optional target path/binary (exposed as TARGET env conceptually; not auto-wired)"),
    oracle: tool.schema.enum(["flag_regex", "crash_signal", "marker_output", "exit_code", "file_effect"]).describe("Success oracle type"),
    oracle_value: tool.schema.string().describe("Oracle parameter (regex/marker/signal/exit code/relative file path)"),
    timeout_sec: tool.schema.number().optional().describe("Per-attempt timeout seconds (default 30)"),
    attempts: tool.schema.number().optional().describe("Number of attempts (default 3)"),
  },
  async execute(args, ctx) {
    const poc = path.isAbsolute(args.poc) ? args.poc : path.join(ctx.directory, args.poc)
    const sandbox = path.join(ctx.worktree, ".habakiri", "sandbox")
    await mkdir(sandbox, { recursive: true })
    const artifactsDir = path.join(ctx.worktree, ".habakiri", "artifacts")
    await mkdir(artifactsDir, { recursive: true })

    const timeoutMs = (args.timeout_sec ?? 30) * 1000
    const n = Math.max(1, args.attempts ?? 3)
    const cmd = detectRunner(poc)

    const results: { attempt: number; code: number; signal?: string; timedOut: boolean; pass: boolean; detail: string; outputPreview: string }[] = []
    let anyPass = false

    for (let i = 1; i <= n; i++) {
      const r = await runOnce(cmd, sandbox, timeoutMs)
      const ev = evaluate(args.oracle, args.oracle_value, r, sandbox)
      if (ev.pass) anyPass = true
      const preview = (r.stdout + "\n" + r.stderr).slice(0, 2000)
      results.push({ attempt: i, code: r.code, signal: r.signal, timedOut: r.timedOut, pass: ev.pass, detail: ev.detail, outputPreview: preview })
      // save full output
      const logPath = path.join(artifactsDir, `poc_verify_attempt${i}_${Date.now()}.log`)
      await writeFile(logPath, `CMD: ${cmd.join(" ")}\nEXIT: ${r.code} SIGNAL: ${r.signal ?? "none"} TIMEDOUT: ${r.timedOut}\n---STDOUT---\n${r.stdout}\n---STDERR---\n${r.stderr}\n`)
      if (ev.pass) break
    }

    const meta = {
      poc,
      oracle: args.oracle,
      oracle_value: args.oracle_value,
      attempts: results.length,
      success: anyPass,
      last_exit_code: results[results.length - 1]?.code,
    }

    const output = [
      `PoC: ${poc}`,
      `Oracle: ${args.oracle} (${args.oracle_value})`,
      `Success: ${anyPass}`,
      "",
      ...results.map((r) => `Attempt ${r.attempt}: ${r.pass ? "PASS" : "FAIL"} — ${r.detail} (exit ${r.code}, signal ${r.signal ?? "none"}, timedOut ${r.timedOut})`),
      "",
      "Output previews:",
      ...results.map((r) => `--- attempt ${r.attempt} ---\n${r.outputPreview}`),
      "",
      "Note: network is not disabled by this wrapper; run in a sandboxed host for untrusted PoCs.",
    ].join("\n")

    ctx.metadata({ title: `poc_verify: ${path.basename(poc)}`, metadata: meta })
    return { title: `poc_verify: ${path.basename(poc)}`, output, metadata: meta }
  },
})
