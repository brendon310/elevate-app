import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
export const createLovableAiGatewayProvider = (key: string) =>
  createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
