import { Inngest } from "inngest";
import { realtimeMiddleware } from "@inngest/realtime";

export const inngest = new Inngest({
  id: "climbing-pill",
  baseUrl: process.env.NODE_ENV === 'production' 
    ? process.env.INNGEST_BASE_URL || "https://api.inngest.com"
    : "http://localhost:8288",
  isDev: process.env.NODE_ENV !== 'production',
  middleware: [realtimeMiddleware()],
}); 