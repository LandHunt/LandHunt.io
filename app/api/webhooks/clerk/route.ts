// app/api/webhooks/clerk/route.ts
import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const hdrs = headers();

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  const evt = wh.verify(body, {
    "svix-id": hdrs.get("svix-id")!,
    "svix-timestamp": hdrs.get("svix-timestamp")!,
    "svix-signature": hdrs.get("svix-signature")!,
  });

  if (evt.type === "user.created") {
    const u = evt.data as any;
    await prisma.user.upsert({
      where: { id: u.id },
      create: {
        id: u.id,
        email: u.email_addresses?.[0]?.email_address ?? "",
        name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
      },
      update: {},
    });
  }

  return new Response("ok", { status: 200 });
}
