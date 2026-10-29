/// <reference path="../env.d.ts" />
import { tool } from "@opencode-ai/plugin"
import { stat } from "node:fs/promises"
import path from "node:path"

async function run(cmd: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const proc = Bun.spawn([cmd, ...args], { stdout: "pipe", stderr: "pipe" })
    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ])
    const code = await proc.exited
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
    "Inspect a binary: file type, architecture, hardening (PIE/NX/Canary/RELRO), ELF header/program headers summary, and selected strings (URLs, paths, format strings). Read-only; never executes the target.",
  args: {
    path: tool.schema.string().describe("Path to the binary (relative to project dir or absolute)"),
  },
  async execute(args, ctx) {
    const target = path.isAbsolute(args.path) ? args.path : path.join(ctx.directory, args.path)
    const st = await stat(target).catch(() => null)
    if (!st) return { title: "binary_inspect", output: `File not found: ${target}`, metadata: { error: "not_found" } }
    if (!st.isFile()) return { title: "binary_inspect", output: `Not a file: ${target}`, metadata: { error: "not_file" } }

    const sections: string[] = []
    const meta: Record<string, any> = { path: target, size: st.size }

    // file
    const f = await run("file", [target])
    sections.push("## file\n" + (f.stdout.trim() || f.stderr.trim() || "(unavailable)"))
    const archMatch = f.stdout.match(/,\s*([^,]+?),\s*(little|big) endian/i)
    if (archMatch) meta.arch = archMatch[1].trim()

    // checksec
    let checksecOut = ""
    if (await which("checksec")) {
      const c = await run("checksec", [`--file=${target}`])
      checksecOut = (c.stdout + c.stderr).trim()
    } else if (await which("checksec.sh")) {
      const c = await run("checksec.sh", [`--file=${target}`])
      checksecOut = (c.stdout + c.stderr).trim()
    }
    if (checksecOut) {
      sections.push("## checksec\n" + checksecOut)
      const low = checksecOut.toLowerCase()
      meta.pie = /pie:\s*yes|position independent/i.test(checksecOut) ? "yes" : /pie:\s*no/i.test(checksecOut) ? "no" : undefined
      meta.nx = /nx:\s*yes|nx enabled/i.test(checksecOut) ? "yes" : /nx:\s*no/i.test(checksecOut) ? "no" : undefined
      meta.canary = /canary:\s*yes|stack canary/i.test(checksecOut) ? "yes" : /canary:\s*no|no canary/i.test(checksecOut) ? "no" : undefined
      meta.relro = /relro:\s*(full|partial|no)/i.exec(checksecOut)?.[1]?.toLowerCase()
      meta.stripped = /stripped/i.test(low) ? true : undefined
    } else {
      sections.push("## checksec\n(unavailable: checksec not found)")
    }

    // readelf header
    if (await which("readelf")) {
      const h = await run("readelf", ["-h", target])
      sections.push("## readelf -h\n" + h.stdout.trim().slice(0, 4000))
      const l = await run("readelf", ["-l", target])
      // extract GNU_STACK / RELRO lines
      const interesting = l.stdout.split("\n").filter((ln) => /GNU_STACK|GNU_RELRO|INTERP|Requesting|LOAD/i.test(ln))
      sections.push("## readelf -l (filtered)\n" + interesting.join("\n").slice(0, 4000))
    } else {
      sections.push("## readelf\n(unavailable: readelf not found)")
    }

    // strings: prioritize URLs, paths, format strings
    if (await which("strings")) {
      const s = await run("strings", ["-a", "-n", "4", target])
      const lines = s.stdout.split("\n")
      const picked: string[] = []
      const seen = new Set<string>()
      const push = (l: string) => {
        if (seen.has(l)) return
        seen.add(l)
        picked.push(l)
      }
      for (const l of lines) {
        if (/https?:\/\//.test(l) || /\/[a-zA-Z0-9._-]{3,}/.test(l) || /%[0-9$]*[sdupxXn]/.test(l)) push(l)
        if (picked.length >= 120) break
      }
      // fallback: first 40 printable strings if nothing matched
      if (picked.length === 0) for (const l of lines.slice(0, 40)) push(l)
      sections.push("## strings (selected)\n" + picked.join("\n"))
    } else {
      sections.push("## strings\n(unavailable: strings not found)")
    }

    const output = sections.join("\n\n")
    ctx.metadata({ title: `binary_inspect: ${path.basename(target)}`, metadata: meta })
    return { title: `binary_inspect: ${path.basename(target)}`, output, metadata: meta }
  },
})
