import path from "node:path";
import nextra from "nextra";
import { withAiReady } from "next-ai-ready/config";

const withNextra = nextra({});

const nextConfig = withNextra({
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
});

export default withAiReady({ agentReadable: true })(nextConfig);
