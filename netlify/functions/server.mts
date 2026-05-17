import type { Handler, HandlerEvent } from "@netlify/functions";

// Build artifact produced by `npm run build` → dist/server/index.js.
// Not present at TypeScript compile time; esbuild bundles it at deploy time.
// @ts-expect-error
import serverHandler from "../../dist/server/index.js";

function buildRequest(event: HandlerEvent): Request {
  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers)) {
    if (value !== undefined) headers.set(key, value);
  }
  return new Request(event.rawUrl, {
    method: event.httpMethod,
    headers,
    body:
      event.body && event.httpMethod !== "GET" && event.httpMethod !== "HEAD"
        ? event.isBase64Encoded
          ? Buffer.from(event.body, "base64")
          : event.body
        : null,
  });
}

export const handler: Handler = async (event) => {
  const response: Response = await serverHandler(buildRequest(event));

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    statusCode: response.status,
    headers,
    body: await response.text(),
  };
};
