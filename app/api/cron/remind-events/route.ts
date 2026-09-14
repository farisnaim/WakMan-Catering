import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import webpush from "web-push";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

// Setup Web Push Credentials
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@wakmancatering.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 1. Kira Tarikh H-0 (Hari Ini), H-1 (Esok), dan H-7 (7 Hari Lagi)
    const todayObj = new Date();

    const h0Date = todayObj.toISOString().split("T")[0]; // Hari Ini

    const h1Obj = new Date(todayObj);
    h1Obj.setDate(h1Obj.getDate() + 1);
    const h1Date = h1Obj.toISOString().split("T")[0]; // Esok

    const h7Obj = new Date(todayObj);
    h7Obj.setDate(h7Obj.getDate() + 7);
    const h7Date = h7Obj.toISOString().split("T")[0]; // 7 Hari Lagi

    // 2. Tarik tempahan dari Supabase untuk H-0, H-1, dan H-7
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .in("event_date", [h0Date, h1Date, h7Date]);

    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Tiada tempahan majlis untuk H-0 (${h0Date}), H-1 (${h1Date}), atau H-7 (${h7Date}).`,
        count: 0,
      });
    }

    // 3. Tarik data pelanggan untuk tempahan berkenaan
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

    // 4. Kelompokkan Tempahan Mengikut Status Kategori (H-0, H-1, H-7)
    const h0Orders = orders.filter((o) => o.event_date === h0Date);
    const h1Orders = orders.filter((o) => o.event_date === h1Date);
    const h7Orders = orders.filter((o) => o.event_date === h7Date);

    const notificationsToInsert: any[] = [];
    let emailSummaryHtml = "";

    // --- KENDALIKAN MAJLIS HARI INI (H-0) ---
    if (h0Orders.length > 0) {
      emailSummaryHtml += `<h3 style="color: #dc2626;">🔥 MAJLIS HARI INI (${h0Date})</h3>`;
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
      });
    }

    // --- KENDALIKAN MAJLIS ESOK (H-1) ---
    if (h1Orders.length > 0) {
      emailSummaryHtml += `<h3 style="color: #d97706;">⚠️ PERSIAPAN ESOK (H-1: ${h1Date})</h3>`;
      h1Orders.forEach((o) => {
        const cust = customerMap[o.customer_id] || { name: "Pelanggan" };
        notificationsToInsert.push({
          order_id: o.id,
          title: `📦 Persediaan Majlis Esok (#${o.order_number || o.id})`,
          message: `Majlis ${cust.name} esok (${h1Date}). Sila siapkan perkakas & bahan katering malam ini.`,
          type: "reminder_h1",
          is_read: false,
        });
        emailSummaryHtml += `<p>• <strong>${cust.name}</strong> (#${o.order_number || o.id}) - Check barang & logistik.</p>`;
      });
    }

    // --- KENDALIKAN MAJLIS 7 HARI LAGI (H-7) ---
    if (h7Orders.length > 0) {
      emailSummaryHtml += `<h3 style="color: #2563eb;">📅 PERANCANGAN 7 HARI LAGI (H-7: ${h7Date})</h3>`;
      h7Orders.forEach((o) => {
        const cust = customerMap[o.customer_id] || { name: "Pelanggan" };
        notificationsToInsert.push({
          order_id: o.id,
          title: `🛒 Semakan Stok & Supplier (H-7: #${o.order_number || o.id})`,
          message: `Majlis ${cust.name} pada ${h7Date}. Sila buat semakan stok bahan mentah & sahkan dengan pembekal.`,
          type: "reminder_h7",
          is_read: false,
        });
        emailSummaryHtml += `<p>• <strong>${cust.name}</strong> (#${o.order_number || o.id}) - Semak stok & pengesahan supplier.</p>`;
      });
    }

    // 5. Masukkan Rekod Notifikasi ke Jadual `notifications` Supabase
    if (notificationsToInsert.length > 0) {
      await supabase.from("notifications").insert(notificationsToInsert);
    }

    // 6. Hantar Notifikasi Skrin (Web Push API)
    const { data: pushSubs } = await supabase
      .from("push_subscriptions")
      .select("*");
    if (pushSubs && pushSubs.length > 0) {
      const pushPayload = JSON.stringify({
        title: `⚡ WakMan Smart Reminder`,
        body: `H-0: ${h0Orders.length} | H-1: ${h1Orders.length} | H-7: ${h7Orders.length} Majlis`,
      });

      for (const sub of pushSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            pushPayload,
          );
        } catch (err: any) {
          console.error("Gagal hantar push ke peranti:", err.endpoint);
        }
      }
    }

    // 7. Hantar Emel Ringkasan Penuh
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
        subject: `📋 [SMART REMINDER] Ringkasan Majlis H-0, H-1 & H-7 (${h0Date})`,
        html: fullEmailHtml,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Smart Cron Job berjaya diproses!",
      summary: {
        h0_count: h0Orders.length,
        h1_count: h1Orders.length,
        h7_count: h7Orders.length,
      },
    });
  } catch (err: any) {
    console.error("Ralat Smart Cron Job:", err.message || err);
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
}
