// src/falClient.ts
import { fal } from "@fal-ai/client";

// konfiguracja proxy, musi wykonać się raz przed użyciem fal.subscribe / queue
fal.config({
  proxyUrl: "/api/fal-proxy"
});

export default fal;
