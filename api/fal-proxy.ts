// api/fal-proxy.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  if (method !== "GET" && method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const target = req.headers["x-fal-target-url"];
  if (typeof target !== "string") {
    return res.status(400).json({ error: "Missing x-fal-target-url header" });
  }

  try {
    const falRes = await fetch(target, {
      method,
      headers: {
        Authorization: `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(req.body) : undefined,
    });

    // forward response headers (oprócz content-length i content-encoding)
    falRes.headers.forEach((value, key) => {
      if (key === "content-length" || key === "content-encoding") return;
      res.setHeader(key, value);
    });

    res.status(falRes.status);
    const data = await falRes.json();
    return res.json(data);
  } catch (err) {
    console.error("Fal proxy error:", err);
    return res.status(500).json({ error: "Proxy error" });
  }
}
