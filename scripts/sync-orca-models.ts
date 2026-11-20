#!/usr/bin/env bun
// Adds OrcaRouter models the bundled catalog lacks (the `orca/*` cyber tier and `orcarouter/*` aliases)
// to provider.orcarouter.models in opencode.json, using GET /v1/models. Dry run unless --write is passed.
// Existing entries are never changed. Writing re-serializes opencode.json, so inline formatting is not kept.

const baseURL = process.env.ORCAROUTER_BASE_URL ?? "https://api.orcarouter.ai/v1"
const key = process.env.ORCAROUTER_API_KEY
const write = process.argv.includes("--write")
const file = "opencode.json"

type Config = {
  provider?: Record<string, { models?: Record<string, object> }>
  providers?: unknown
}

if (!key) {
  console.error("ORCAROUTER_API_KEY is not set (put it in .env and run via `make sync-models`)")
  process.exit(1)
}
if (!(await Bun.file(file).exists())) {
  console.error(`${file} not found in ${process.cwd()}; run \`make setup\` first`)
  process.exit(1)
}

const config: Config = await Bun.file(file).json()
// `provider` (v1 form) and `providers` (v2 form) both define orcarouter: the v2 entry replaces the whole v1 one,
// so models written here would silently not load.
if (config.providers !== undefined) {
  console.error(
    `${file} has a \`providers\` key. This script writes to \`provider\`, and the two conflict. ` +
      "Move the orcarouter entry into `provider` (see opencode.json.example), then re-run.",
  )
  process.exit(1)
}

const res = await fetch(`${baseURL}/models`, { headers: { Authorization: `Bearer ${key}` } })
if (!res.ok) {
  console.error(`GET ${baseURL}/models failed: ${res.status} ${res.statusText}`)
  process.exit(1)
}
const body: unknown = await res.json()
const remote =
  typeof body === "object" && body !== null && "data" in body && Array.isArray(body.data)
    ? body.data.flatMap((item: unknown) =>
        typeof item === "object" && item !== null && "id" in item && typeof item.id === "string" ? [item.id] : [],
      )
    : []
if (remote.length === 0) {
  console.error(`${baseURL}/models returned no model ids; leaving ${file} untouched`)
  process.exit(1)
}

const models = (((config.provider ??= {}).orcarouter ??= {}).models ??= {})
const added = remote.filter((id) => (id.startsWith("orca/") || id.startsWith("orcarouter/")) && !(id in models))
const missing = Object.keys(models).filter((id) => !remote.includes(id))

// Model references are `<provider>/<model id>`, so ids that start with `orcarouter/` end up doubled.
added.forEach((id) => console.log(`+ orcarouter/${id}`))
missing.forEach((id) => console.log(`? orcarouter/${id} (configured, but not in /v1/models)`))
if (missing.length > 0)
  console.log("Note: keys in opencode.json are the raw ids from /v1/models, without the provider prefix.")
console.log(
  `${remote.length} models on the server, ${added.length} to add, ${missing.length} configured but not listed`,
)

if (added.length === 0) process.exit(0)
if (!write) {
  console.log("Dry run. Re-run with --write (or `make sync-models`) to update opencode.json.")
  process.exit(0)
}

added.forEach((id) => (models[id] = {}))
await Bun.write(file, JSON.stringify(config, null, 2) + "\n")
console.log(`Updated ${file}. New entries have no limit set, so they default to context 200000 / output 32000.`)
