// app/api/telegram/webhook/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramGroupMessage } from "@/lib/telegram";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

function getMalaysiaDateString(daysToAdd = 0): string {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysToAdd);

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(targetDate);
}

export async function POST(request: Request) {
  try {
    const update = await request.json();
    const messageText = update?.message?.text || "";

    if (!messageText) {
      return NextResponse.json({ ok: true });
    }

    const command = messageText.trim().split(" ")[0].toLowerCase();

    // ARAHAN: /hariini
    if (command === "/hariini" || command === "/hariini@namabot") {
      const today = getMalaysiaDateString(0);
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("event_date", today);

      let reply = `📅 <b>SENARAI MAJLIS HARI INI (${today})</b>\n`;

      if (!orders || orders.length === 0) {
        reply += "✨ Tiada majlis dijadualkan untuk hari ini.";
      } else {
        orders.forEach((o, i) => {
          reply += `\n${i + 1}. <b>#${o.order_number || o.id}</b> - ${o.order_details || "Tiada nota"}\n`;
        });
      }

      await sendTelegramGroupMessage(reply);
    }

    // ARAHAN: /esok
    if (command === "/esok" || command === "/esok@namabot") {
      const tomorrow = getMalaysiaDateString(1);
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("event_date", tomorrow);

      let reply = `⚠️ <b>SENARAI MAJLIS ESOK (${tomorrow})</b>\n`;

      if (!orders || orders.length === 0) {
        reply += "✨ Tiada majlis dijadualkan untuk esok.";
      } else {
        orders.forEach((o, i) => {
          reply += `\n${i + 1}. <b>#${o.order_number || o.id}</b> - ${o.order_details || "Tiada nota"}\n`;
        });
      }

      await sendTelegramGroupMessage(reply);
    }

    //kalau nak tambah boleh tulis kat sini

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Ralat Webhook Telegram:", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
