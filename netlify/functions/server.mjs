import serverHandler from "../../dist/server/index.js";

function buildRequest(event) {
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

export const handler = async (event) => {
  const response = await serverHandler(buildRequest(event));

  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    statusCode: response.status,
    headers,
    body: await response.text(),
  };
};
