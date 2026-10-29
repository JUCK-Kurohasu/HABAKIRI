/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"
import path from "node:path"
import { mkdir, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"

async function run(cmd: string, args: string[], timeoutMs = 120000): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const proc = Bun.spawn([cmd, ...args], { stdout: "pipe", stderr: "pipe" })
    const timer = setTimeout(() => proc.kill(), timeoutMs)
    const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
    const code = await proc.exited
    clearTimeout(timer)
    return { code, stdout, stderr }
  } catch (e) {
    return { code: 127, stdout: "", stderr: String(e) }
  }
}

async function which(cmd: string): Promise<boolean> {
  const r = await run(process.platform === "win32" ? "where" : "which", [cmd])
  return r.code === 0
}

export default tool({
  description:
    "Summarize disassembly of a binary: function list, cross-references to dangerous APIs, and (optionally) disassembly of a named function. Uses radare2 first, then objdump fallback. Full output is saved to .habakiri/artifacts.",
  args: {
    path: tool.schema.string().describe("Path to the binary"),
    function: tool.schema.string().optional().describe("Function name or address to disassemble (optional)"),
    max_lines: tool.schema.number().optional().describe("Max lines of disassembly to include (default 200)"),
  },
  async execute(args, ctx) {
    const target = path.isAbsolute(args.path) ? args.path : path.join(ctx.directory, args.path)
    const artifactsDir = path.join(ctx.worktree, ".habakiri", "artifacts")
    await mkdir(artifactsDir, { recursive: true })
    const maxLines = args.max_lines ?? 200

    // radare2 path
    if (await which("r2")) {
      const cmds = ["aa", "afl", "ii"]
      if (args.function) cmds.push(`pdf @ ${args.function}`)
      // dangerous api xrefs
      cmds.push("axt @ sym.imp.strcpy", "axt @ sym.imp.gets", "axt @ sym.imp.sprintf", "axt @ sym.imp.system")
      const script = cmds.join("; ")
      const r = await run("r2", ["-q", "-c", script, target])
      const full = (r.stdout + "\n" + r.stderr).trim()
      await writeFile(path.join(artifactsDir, `disasm_${Date.now()}.txt`), full)
      // summarize
      const lines = full.split("\n")
      const funcs = lines.filter((l) => /^\s*0x[0-9a-f]+\s+\d+\s+\d+\s+/.test(l)).slice(0, 80)
      const xrefs = lines.filter((l) => /strncpy|strcpy|gets|sprintf|system|memcpy/.test(l)).slice(0, 60)
      const disasm = lines.filter((l) => /^\s*(0x[0-9a-f]+|\|)/.test(l)).slice(0, maxLines)
      const output = [
        `Binary: ${target}`,
        `Tool: radare2`,
        "",
        "## function count (sample)",
        `${funcs.length} functions listed (see artifact for full list)`,
        funcs.slice(0, 40).join("\n"),
        "",
        "## dangerous API xrefs (best-effort)",
        xrefs.join("\n") || "(none found)",
        "",
        args.function ? "## disassembly (truncated)" : "## disassembly (skipped; pass function=...)",
        args.function ? disasm.join("\n").slice(0, 12000) : "(pass function= to get pdf)",
        "",
        `Full output saved to ${artifactsDir}`,
      ].join("\n")
      ctx.metadata({ title: `disasm_summary: ${path.basename(target)}`, metadata: { tool: "radare2", function_count: funcs.length } })
      return { title: `disasm_summary: ${path.basename(target)}`, output, metadata: { tool: "radare2", functions: funcs.length } }
    }

    // objdump fallback
    if (await which("objdump")) {
      const r = await run("objdump", ["-t", target])
      const full = (r.stdout + r.stderr).trim()
      await writeFile(path.join(artifactsDir, `disasm_${Date.now()}.txt`), full)
      const syms = full.split("\n").filter((l) => / F |O /.test(l)).slice(0, 60)
      const output = [
        `Binary: ${target}`,
        `Tool: objdump (fallback)`,
        "",
        "## symbols (sample)",
        syms.join("\n") || "(none)",
        "",
        "Note: function-level disassembly requires radare2 or Ghidra. Install radare2 for richer output.",
      ].join("\n")
      ctx.metadata({ title: `disasm_summary: ${path.basename(target)}`, metadata: { tool: "objdump" } })
      return { title: `disasm_summary: ${path.basename(target)}`, output, metadata: { tool: "objdump" } }
    }

    return {
      title: "disasm_summary",
      output: "Neither radare2 nor objdump found. Install radare2 (preferred) or binutils for this tool.",
      metadata: { error: "no_disassembler" },
    }
  },
})
