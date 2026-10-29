import { Plugin } from "@opencode/plugin"

// v2 port note: v1 hooks (chat.message, chat.params, experimental.session.compacting)
// are not available in v2's promise plugin API. Model selection is handled by
// the agent definitions in .opencode/agent/*.md. Compaction preservation is
// pending a v2 equivalent.
export default Plugin.define({
  id: "orca-router",
  async setup(ctx) {
    // no-op in v2 for now
  },
})
