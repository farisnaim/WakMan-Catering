import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramGroupMessage } from "@/lib/telegram";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      address1,
      address2,
      existingCustomerId,
      eventDate,
      orderDetails,
      status,
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Nama dan No. Telefon pelanggan wajib diisi." },
        { status: 400 },
      );
    }

    let customerIdToUse = existingCustomerId;

    // 1. Jika pelanggan belum wujud, simpan rekod baharu dalam jadual `customers`
    if (!customerIdToUse) {
      const { data: newCust, error: custErr } = await supabase
        .from("customers")
        .insert([
          {
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            address1: address1?.trim() || null,
            address2: address2?.trim() || null,
          },
        ])
        .select()
        .single();

      if (custErr) throw custErr;
      customerIdToUse = newCust.id;
    } else {
      // Kemaskini maklumat pelanggan sedia ada
      await supabase
        .from("customers")
        .update({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          address1: address1?.trim() || null,
          address2: address2?.trim() || null,
        })
        .eq("id", customerIdToUse);
    }

    // 2. Simpan rekod tempahan dalam jadual `orders`
    const { data: createdOrder, error: orderErr } = await supabase
      .from("orders")
      .insert([
        {
          customer_id: customerIdToUse,
          event_date: eventDate || null,
          order_details: orderDetails?.trim() || null,
          status: status || "pending",
        },
      ])
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 3. Panggil Helper Telegram untuk Menghantar Notifikasi Real-Time
    const appBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://wakmancatering.vercel.app";

    const telegramMsg =
      `📦 <b>TEMPAHAN BAHARU MASUK!</b>\n\n` +
      `👤 <b>Pelanggan:</b> ${customerName.trim()}\n` +
      `📞 <b>No. Tel:</b> <code>${customerPhone.trim()}</code>\n` +
      `📅 <b>Tarikh Majlis:</b> <code>${eventDate || "Belum Ditetapkan"}</code>\n` +
      `📝 <b>Perincian:</b>\n${orderDetails?.trim() || "Tiada nota"}`;

    const buttons = [
      [{ text: "🔎 Lihat Senarai Tempahan", url: `${appBaseUrl}/orders` }],
    ];

    await sendTelegramGroupMessage(telegramMsg, buttons);

    return NextResponse.json({
      success: true,
      data: createdOrder,
    });
  } catch (err: any) {
    console.error("Ralat dalam API Orders POST:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses tempahan." },
      { status: 500 },
    );
  }
}
