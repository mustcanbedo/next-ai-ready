import { withAiReady } from "next-ai-ready";
import path from "node:path";

const nextConfig = {
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
};

export default withAiReady()(nextConfig);
