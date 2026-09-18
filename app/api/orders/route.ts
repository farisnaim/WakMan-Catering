// Contoh di dalam handler POST app/api/orders/route.ts
import { NextResponse } from "next/server";
import { sendTelegramGroupMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  // ... Kod menyimpan tempahan ke Supabase ...

  // Selepas tempahan berjaya disimpan:
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://wakmancatering.vercel.app";

  const telegramMsg =
    `📦 <b>TEMPAHAN BAHARU MASUK!</b>\n\n` +
    `👤 <b>Pelanggan:</b> ${newOrder.customer_name}\n` +
    `📅 <b>Tarikh Majlis:</b> <code>${newOrder.event_date}</code>\n` +
    `💰 <b>Jumlah:</b> RM ${newOrder.total_amount}\n` +
    `📝 <b>Nota:</b> ${newOrder.order_details || "Tiada"}`;

  const buttons = [
    [{ text: "🔎 Lihat Tempahan", url: `${appBaseUrl}/orders` }],
  ];

  await sendTelegramGroupMessage(telegramMsg, buttons);

  return NextResponse.json({ success: true });
}
