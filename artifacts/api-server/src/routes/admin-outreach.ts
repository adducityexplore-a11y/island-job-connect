import { Router } from "express";
import { z } from "zod";
import { adminAuditLogsTable, db } from "@workspace/db";
import { requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

const sendBody = z.object({
  recipients: z.array(z.string().email()).min(1).max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(10000),
});

interface ResendBatchResult {
  data?: { id: string } | null;
  error?: { message: string } | null;
}

async function sendOutreachBatch(recipients: string[], subject: string, message: string): Promise<{ sent: number; failed: Array<{ email: string; error: string }> }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  const from = process.env.RESEND_FROM_EMAIL || "The Jobs MV <hello@thejobsmv.com>";

  const failed: Array<{ email: string; error: string }> = [];
  let sent = 0;

  for (let i = 0; i < recipients.length; i += 100) {
    const chunk = recipients.slice(i, i + 100);
    const response = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(chunk.map((email) => ({ from, to: email, subject, text: message }))),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      chunk.forEach((email) => failed.push({ email, error: `Send failed (${response.status})` }));
      continue;
    }
    const data = await response.json() as { data?: ResendBatchResult[] };
    const results = data.data ?? [];
    chunk.forEach((email, index) => {
      const result = results[index];
      if (result?.error) failed.push({ email, error: result.error.message });
      else sent += 1;
    });
  }
  return { sent, failed };
}

router.post("/admin/outreach/send", requireAdmin, async (req, res) => {
  const parsed = sendBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid input", details: parsed.error.issues });

  let result: { sent: number; failed: Array<{ email: string; error: string }> };
  try {
    result = await sendOutreachBatch(parsed.data.recipients, parsed.data.subject, parsed.data.message);
  } catch (error) {
    req.log.error({ event: "outreach_send_failed", err: error }, "Outreach email send failed");
    return void res.status(502).json({ error: "Failed to send outreach emails" });
  }

  await db.insert(adminAuditLogsTable).values({
    adminId: req.admin!.id,
    action: "outreach.email_sent",
    entityType: "outreach",
    entityId: null,
    metadata: { recipientCount: parsed.data.recipients.length, sent: result.sent, failedCount: result.failed.length, subject: parsed.data.subject },
  });

  res.json(result);
});

export default router;
