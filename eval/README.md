# HABAKIRI Regression Harness

This directory holds the regression suite described in HABAKIRI_DESIGN.md §10.
Three classic pwn challenges are provided as synthetic targets:

- `ret2win` — stack buffer overflow, no PIE/NX bypass needed, classic ret2win
- `pie_canary_fmt` — PIE + stack canary + format string (info leak + overwrite)
- `orw` — open/read/write shellcode under seccomp (no execve)

## Layout

- `challenges/*.c` — vulnerable source
- `challenges/Makefile` — builds the three binaries into `challenges/bin/`
- `run.ts` — builds and smoke-checks the binaries (does not drive OpenCode)

The full "generate -> poc_verify -> score" loop is driven by OpenCode itself using
the `poc_verify` tool against the binaries in `challenges/bin/`. This harness only
ensures the targets build and behave as expected (crash / flag oracle).

## Usage

```sh
cd eval
make -C challenges
bun run run.ts
```

Binaries are written to `eval/challenges/bin/` (gitignored via /eval/challenges/bin).
