import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import webpush from "web-push";
import { sendTelegramGroupMessage } from "@/lib/telegram";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:farisnaimsss@gmail.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

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

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const h0Date = getMalaysiaDateString(0);
    const h1Date = getMalaysiaDateString(1);
    const h5Date = getMalaysiaDateString(5);

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .in("event_date", [h0Date, h1Date, h5Date]);

    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Tiada tempahan majlis untuk Hari Ini (${h0Date}), Esok (${h1Date}), atau 5 Hari Lagi (${h5Date}). Notifikasi Telegram dilangkau (Smart Muting).`,
        count: 0,
      });
    }

    const customerIds = orders
      .map((order) => order.customer_id)
      .filter((id) => id !== null);

    let customerMap: Record<number, { name: string; phone: string }> = {};

    if (customerIds.length > 0) {
      const { data: customers } = await supabase
        .from("customers")
        .select("id, customer_name, customer_phone")
        .in("id", customerIds);

      if (customers) {
        customers.forEach((c) => {
          customerMap[c.id] = {
            name: c.customer_name || "Pelanggan Tanpa Nama",
            phone: c.customer_phone || "-",
          };
        });
      }
    }

    const h0Orders = orders.filter((o) => o.event_date === h0Date);
    const h1Orders = orders.filter((o) => o.event_date === h1Date);
    const h5Orders = orders.filter((o) => o.event_date === h5Date);

    const notificationsToInsert: any[] = [];
    let emailSummaryHtml = "";
    let telegramMessage = `🍗 <b>WAKMAN CATERING SMART REMINDER</b>\n📅 Tarikh: <code>${h0Date}</code>\n\n`;

    if (h0Orders.length > 0) {
      emailSummaryHtml += `<h3 style="color: #dc2626;">🔥 MAJLIS HARI INI (${h0Date})</h3>`;
      telegramMessage += `🔥 <b>MAJLIS HARI INI (H-0)</b>\n`;

      h0Orders.forEach((o) => {
        const cust = customerMap[o.customer_id] || { name: "Pelanggan" };
        notificationsToInsert.push({
          order_id: o.id,
          title: `🚨 MAJLIS HARI INI (#${o.order_number || o.id})`,
          message: `Majlis untuk ${cust.name} berlangsung hari ini! Sila pastikan penghantaran lancar.`,
          type: "reminder_h0",
          is_read: false,
        });

        emailSummaryHtml += `<p>• <strong>${cust.name}</strong> (#${o.order_number || o.id}) - ${o.order_details || "Tiada nota"}</p>`;
        telegramMessage += `• <b>${cust.name}</b> (#${o.order_number || o.id}) - ${o.order_details || "Tiada nota"}\n`;
      });
      telegramMessage += `\n`;
    }

    if (h1Orders.length > 0) {
      emailSummaryHtml += `<h3 style="color: #d97706;">⚠️ PERSIAPAN ESOK (H-1: ${h1Date})</h3>`;
      telegramMessage += `⚠️ <b>PERSIAPAN ESOK (H-1: ${h1Date})</b>\n`;

      h1Orders.forEach((o) => {
        const cust = customerMap[o.customer_id] || { name: "Pelanggan" };
        notificationsToInsert.push({
          order_id: o.id,
          title: `📦 Persediaan Majlis Esok (#${o.order_number || o.id})`,
          message: `Majlis ${cust.name} esok (${h1Date}). Sila siapkan perkakas & bahan katering malam ini.`,
          type: "reminder_h1",
          is_read: false,
        });

        emailSummaryHtml += `<p>• <strong>${cust.name}</strong> (#${o.order_number || o.id}) - Beli Barang, Check Tray, Pinggan, Cawan, Sudu, Kaki Tray, Tong Air.</p>`;
        telegramMessage += `• <b>${cust.name}</b> (#${o.order_number || o.id}) - Beli Barang, Check Tray, Pinggan, Cawan, Sudu, Kaki Tray, Tong Air.\n\n`;
      });
      telegramMessage += `\n`;
    }

    if (h5Orders.length > 0) {
      emailSummaryHtml += `<h3 style="color: #2563eb;">📅 PERANCANGAN 5 HARI LAGI (H-5: ${h5Date})</h3>`;
      telegramMessage += `📅 <b>PERANCANGAN 5 HARI LAGI (H-5: ${h5Date})</b>\n`;

      h5Orders.forEach((o) => {
        const cust = customerMap[o.customer_id] || { name: "Pelanggan" };
        notificationsToInsert.push({
          order_id: o.id,
          title: `🛒 Semakan Stok & Supplier (H-5: #${o.order_number || o.id})`,
          message: `Majlis ${cust.name} pada ${h5Date}. Sila buat semakan stok bahan mentah & sahkan dengan pembekal.`,
          type: "reminder_h5",
          is_read: false,
        });

        emailSummaryHtml += `<p>• <strong>${cust.name}</strong> (#${o.order_number || o.id}) - Semak stok & pengesahan supplier.</p>`;
        telegramMessage += `• <b>${cust.name}</b> (#${o.order_number || o.id}) - Semak stok & pengesahan supplier.\n`;
      });
      telegramMessage += `\n`;
    }

    if (notificationsToInsert.length > 0) {
      await supabase.from("notifications").insert(notificationsToInsert);
    }

    // FUNGSI 1: SMART MUTING (Hanya hantar ke Telegram jika ada tempahan)
    const totalReminders = h0Orders.length + h1Orders.length + h5Orders.length;
    if (totalReminders > 0) {
      const appBaseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://wakmancatering.com";
      const buttons = [
        [
          { text: "📦 Lihat Senarai Tempahan", url: `${appBaseUrl}/orders` },
          { text: "📅 Buka Kalendar", url: `${appBaseUrl}/calendar` },
        ],
        [{ text: "📊 Dashboard Operasi", url: `${appBaseUrl}/dashboard` }],
      ];

      await sendTelegramGroupMessage(telegramMessage, buttons);
    }

    const { data: pushSubs } = await supabase
      .from("push_subscriptions")
      .select("*");
    if (pushSubs && pushSubs.length > 0) {
      const pushPayload = JSON.stringify({
        title: `⚡ WakMan Smart Reminder`,
        body: `Hari Ini: ${h0Orders.length} | Esok: ${h1Orders.length} | 5 Hari Lagi: ${h5Orders.length} Majlis`,
      });

      for (const sub of pushSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            pushPayload,
          );
        } catch (err: any) {
          console.error("Gagal hantar push ke peranti:", sub.endpoint);
        }
      }
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const fullEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e40af; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
            🍗 WAKMAN CATERING SMART REMINDER
          </h2>
          ${emailSummaryHtml}
          <hr style="margin-top: 20px; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 11px; color: #94a3b8;">Notifikasi automatik dijanakan oleh Sistem WakMan Catering.</p>
        </div>`;

      await transporter.sendMail({
        from: `"WakMan Catering" <${process.env.EMAIL_USER}>`,
        to: process.env.MY_PERSONAL_EMAIL,
        subject: `📋 [SMART REMINDER] Ringkasan Majlis Hari ini, Esok & 5 Hari Lagi (${h0Date})`,
        html: fullEmailHtml,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Smart Cron Job berjaya diproses!",
      summary: {
        h0_date: h0Date,
        h0_count: h0Orders.length,
        h1_date: h1Date,
        h1_count: h1Orders.length,
        h5_date: h5Date,
        h5_count: h5Orders.length,
      },
    });
  } catch (err: any) {
    console.error("Ralat Smart Cron Job:", err.message || err);
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
}
