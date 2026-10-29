import { Plugin } from "@opencode/plugin"

// v2 port note: experimental.session.compacting hook is not available in v2's
// promise plugin API. Compaction preservation is pending a v2 equivalent.
export default Plugin.define({
  id: "findings-compactor",
  async setup(ctx) {
    // no-op in v2 for now
  },
})
