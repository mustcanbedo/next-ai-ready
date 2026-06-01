import "@/actions";
import { createAiReadyMcpHandler } from "@next-ai-ready/next/handlers/mcp";

const handler = await createAiReadyMcpHandler();

export { handler as GET, handler as POST, handler as DELETE };
export const runtime = "nodejs";
