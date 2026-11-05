import type { OpenNextConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: () => r2IncrementalCache,
      tagCache: () => doShardedTagCache({ baseShardSize: 12, regionalCache: true, regionalCacheTtlSec: 5 }),
      queue: () => doQueue,
    },
  },

  edgeExternals: ["node:crypto"],

  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: () => r2IncrementalCache,
      tagCache: () => doShardedTagCache({ baseShardSize: 12, regionalCache: true, regionalCacheTtlSec: 5 }),
      queue: () => doQueue,
    },
  },
};

export default config;
