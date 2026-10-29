// Smoke-check the regression targets build and behave as expected.
// Does NOT drive OpenCode; use poc_verify manually against challenges/bin/*.
import { $ } from "bun"

const dir = new URL("./challenges", import.meta.url).pathname
await $`make -C ${dir}`.quiet()

console.log("Built challenges:")
for (const name of ["ret2win", "pie_canary_fmt", "orw"]) {
  const p = `${dir}/bin/${name}`
  console.log(" -", p)
}

// ret2win: sending a long input should crash or print FLAG
const r1 = await $`printf 'A%.0s' {1..200} | ${dir}/bin/ret2win`.nothrow().quiet()
console.log("ret2win exit:", r1.exitCode, "stdout:", r1.stdout.toString().slice(0, 80))

// pie_canary_fmt: format string leak
const r2 = await $`printf '%p %p %p\\n' | ${dir}/bin/pie_canary_fmt`.nothrow().quiet()
console.log("pie_canary_fmt stdout:", r2.stdout.toString().slice(0, 80))

// orw: should print flag
const r3 = await $`${dir}/bin/orw`.nothrow().quiet()
console.log("orw stdout:", r3.stdout.toString().trim())

console.log("Harness smoke check done.")
