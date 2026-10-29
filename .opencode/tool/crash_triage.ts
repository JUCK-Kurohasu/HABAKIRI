/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"
import path from "node:path"

function parseGdb(out: string): { signal?: string; faultAddr?: string; rip?: string; registers: string[]; backtrace: string[] } {
  const signal = /Program received signal (\S+)/.exec(out)?.[1]
  const faultAddr = /at (0x[0-9a-fA-F]+)/.exec(out)?.[1] ?? /fault address[: ]+(0x[0-9a-fA-F]+)/i.exec(out)?.[1]
  const rip = /rip\s+(0x[0-9a-fA-F]+)/i.exec(out)?.[1]
  const registers: string[] = []
  for (const m of out.matchAll(/^\s*(r[a-z0-9]+|e[a-z]+|rip|rsp|rbp|pc|sp|lr)\s+(0x[0-9a-fA-F]+)/gim)) {
    registers.push(`${m[1]}=${m[2]}`)
  }
  const backtrace: string[] = []
  let inBt = false
  for (const line of out.split("\n")) {
    if (/^#0/.test(line)) inBt = true
    if (inBt) {
      backtrace.push(line)
      if (backtrace.length > 25) break
    }
  }
  return { signal, faultAddr, rip, registers, backtrace }
}

function classify(p: ReturnType<typeof parseGdb>): { level: string; reason: string } {
  const sig = (p.signal ?? "").toUpperCase()
  if (!sig) return { level: "unknown", reason: "no crash signal observed" }
  if (/SIGSEGV|SIGBUS|SIGILL|SIGFPE/.test(sig)) {
    if (p.faultAddr && p.rip && p.faultAddr === p.rip) return { level: "control (high)", reason: "fault address equals instruction pointer" }
    if (p.registers.some((r) => r.toLowerCase().includes("rip=") || r.toLowerCase().includes("pc="))) return { level: "conditional", reason: "crash with register state available; exploitability needs manual review" }
    return { level: "conditional", reason: `${sig} observed` }
  }
  if (/SIGABRT/.test(sig)) return { level: "low", reason: "abort (likely assertion/heap check)" }
  return { level: "low", reason: `${sig} observed` }
}

export default tool({
  description:
    "Run a target under gdb in batch mode and triage the crash: signal, fault address, registers, backtrace, and an initial exploitability classification. Does not run the target outside gdb.",
  args: {
    binary: tool.schema.string().describe("Path to the target binary"),
    args: tool.schema.array(tool.schema.string()).optional().describe("Arguments to pass to the binary"),
    timeout_sec: tool.schema.number().optional().describe("Timeout in seconds (default 30)"),
  },
  async execute(args, ctx) {
    const target = path.isAbsolute(args.binary) ? args.binary : path.join(ctx.directory, args.binary)
    const timeout = (args.timeout_sec ?? 30) * 1000
    const argv = args.args ?? []

    const gdbArgs = [
      "-batch",
      "-ex", "set pagination off",
      "-ex", "run",
      "-ex", "info registers",
      "-ex", "x/16gx $rsp",
      "-ex", "bt 25",
      "--args", target, ...argv,
    ]

    let stdout = "", stderr = "", code: number | null = null
    try {
      const proc = Bun.spawn(["gdb", ...gdbArgs], { stdout: "pipe", stderr: "pipe" })
      const timer = setTimeout(() => proc.kill(), timeout)
      const [o, e] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
      stdout = o; stderr = e
      code = await proc.exited
      clearTimeout(timer)
    } catch (e) {
      return { title: "crash_triage", output: `Failed to launch gdb: ${String(e)}\nIs gdb installed?`, metadata: { error: "gdb_missing" } }
    }

    const combined = stdout + "\n" + stderr
    const parsed = parseGdb(combined)
    const verdict = classify(parsed)

    const meta = {
      signal: parsed.signal,
      fault_addr: parsed.faultAddr,
      rip: parsed.rip,
      classification: verdict.level,
      exit_code: code,
    }

    const output = [
      "## gdb output (truncated)",
      combined.slice(0, 8000),
      "",
      "## parsed",
      `signal: ${parsed.signal ?? "(none)"}`,
      `fault address: ${parsed.faultAddr ?? "(none)"}`,
      `rip: ${parsed.rip ?? "(none)"}`,
      `registers: ${parsed.registers.slice(0, 16).join(", ")}`,
      "",
      "## backtrace",
      parsed.backtrace.join("\n") || "(none)",
      "",
      "## classification",
      `${verdict.level} — ${verdict.reason}`,
    ].join("\n")

    ctx.metadata({ title: `crash_triage: ${path.basename(target)}`, metadata: meta })
    return { title: `crash_triage: ${path.basename(target)}`, output, metadata: meta }
  },
})
