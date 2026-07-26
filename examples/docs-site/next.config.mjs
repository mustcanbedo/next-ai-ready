import { withAiReady } from "next-ai-ready";
import path from "node:path";

const nextConfig = {
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  async redirects() {
    return [{ source: "/icon.png", destination: "/icon.svg", permanent: true }];
  },
};

export default withAiReady({ agentReadable: true })(nextConfig);
