import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  // 1. Semakan Keselamatan (Security Check)
  const authHeader = request.headers.get("authorization");
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Tarikh Hari Ini (Format YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  try {
    // 3. Cari tempahan pada jadual 'orders'
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("event_date", today);

    if (ordersError) {
      console.error("Ralat membaca jadual orders:", ordersError.message);
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Tiada tempahan majlis didaftarkan untuk hari ini (${today}).`,
        count: 0,
      });
    }

    // 4. Tarik maklumat pelanggan mengikut customer_id
    const customerIds = orders
      .map((order) => order.customer_id)
      .filter((id) => id !== null);

    let customerMap: Record<number, { name: string; phone: string }> = {};

    if (customerIds.length > 0) {
      const { data: customers, error: custError } = await supabase
        .from("customers")
        .select("id, customer_name, customer_phone")
        .in("id", customerIds);

      if (!custError && customers) {
        customers.forEach((c) => {
          customerMap[c.id] = {
            name: c.customer_name || "Pelanggan Tanpa Nama",
            phone: c.customer_phone || "-",
          };
        });
      }
    }

    // 5. Bina kandungan emel berasaskan UI yang kemas
    let htmlItems = orders
      .map((order, index) => {
        const customerInfo = customerMap[order.customer_id] || {
          name: "Pelanggan Tidak Dijumpai",
          phone: "-",
        };

        // Parse quotation_data secara teratur
        let qData: any = null;
        if (typeof order.quotation_data === "string") {
          try {
            qData = JSON.parse(order.quotation_data);
          } catch (e) {
            qData = null;
          }
        } else {
          qData = order.quotation_data;
        }

        // Bina Baris Senarai Item Menu
        let itemsTableRows = "";
        if (qData && Array.isArray(qData.items)) {
          itemsTableRows = qData.items
            .map(
              (item: any) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 12px; font-size: 13px; color: #334155;">${item.item_name || "-"}</td>
                <td style="padding: 8px 12px; font-size: 13px; color: #334155; text-align: center;">${item.qty || 0}</td>
                <td style="padding: 8px 12px; font-size: 13px; color: #334155; text-align: right;">RM ${Number(item.unit_price || 0).toFixed(2)}</td>
              </tr>
            `,
            )
            .join("");
        }

        // Seksyen Jadual Menu & Ringkasan Harga
        const itemsSection = itemsTableRows
          ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
              <thead>
                <tr style="background-color: #f1f5f9; color: #475569; text-align: left; font-size: 12px;">
                  <th style="padding: 8px 12px;">Item / Menu</th>
                  <th style="padding: 8px 12px; text-align: center;">Kuantiti</th>
                  <th style="padding: 8px 12px; text-align: right;">Harga Unit</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTableRows}
              </tbody>
            </table>
          `
          : `<p style="font-size: 13px; color: #64748b; italic;">Tiada maklumat item menu.</p>`;

        const totalPriceHtml = qData?.total_price
          ? `<div style="text-align: right; margin-top: 10px; font-size: 14px; color: #1e293b;">
              <strong>Jumlah Keseluruhan:</strong> <span style="font-size: 16px; color: #16a34a; font-weight: bold;">RM ${Number(qData.total_price).toFixed(2)}</span>
            </div>`
          : "";

        const notesHtml = qData?.notes
          ? `<div style="margin-top: 10px; padding: 10px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: 12px; color: #92400e;">
              <strong>Nota Sebut Harga:</strong> ${qData.notes}
            </div>`
          : "";

        return `
        <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-bottom: 20px; background-color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          
          <!-- Header Tempahan -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 12px;">
            <h3 style="margin: 0; color: #1e293b; font-size: 16px;">
              📌 No. Tempahan: <span style="color: #2563eb;">#${order.order_number || order.id}</span>
            </h3>
          </div>

          <!-- Info Pelanggan & Majlis -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 120px;">👤 <strong>Pelanggan:</strong></td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${customerInfo.name}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">📞 <strong>No. Telefon:</strong></td>
              <td style="padding: 4px 0;"><a href="https://wa.me/${customerInfo.phone.replace(/[^0-9]/g, "")}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${customerInfo.phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">📅 <strong>Tarikh Majlis:</strong></td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${order.event_date}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">📝 <strong>Ringkasan:</strong></td>
              <td style="padding: 4px 0; color: #334155;">${order.order_details || "-"}</td>
            </tr>
          </table>

          <!-- Senarai Menu (Quotation Items) -->
          <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
            <span style="font-size: 13px; font-weight: bold; color: #475569;">🍽️ Perincian Menu & Sebut Harga:</span>
            ${itemsSection}
            ${totalPriceHtml}
            ${notesHtml}
          </div>

        </div>
      `;
      })
      .join("");

    const emailTemplate = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        
        <!-- Header Utama -->
        <div style="background-color: #1e40af; color: #ffffff; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.5px;">🍗 WAKMAN CATERING REMINDER</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Senarai Majlis Katering Hari Ini (${today})</p>
        </div>
        
        <!-- Kandungan Utama -->
        <div style="padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 14px; color: #334155; margin-top: 0;">
            Assalamualaikum / Salam Sejahtera,<br/>
            Terdapat <strong>${orders.length} majlis</strong> yang dijadualkan berlangsung pada hari ini:
          </p>
          
          ${htmlItems}
          
          <!-- Footer -->
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 12px; color: #64748b;">
            <p style="margin: 0;"><em>Sila pastikan semua logistik dan hidangan telah disemak.</em></p>
            <p style="margin: 4px 0 0 0; font-weight: bold; color: #1e40af;">WakMan Catering System</p>
          </div>
        </div>
      </div>
    `;

    // 6. Konfigurasi Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 7. Hantar Emel Notifikasi
    await transporter.sendMail({
      from: `"WakMan Catering System" <${process.env.EMAIL_USER}>`,
      to: process.env.MY_PERSONAL_EMAIL,
      subject: `🚨 [PERINGATAN MAJLIS] ${orders.length} Tempahan Hari Ini (${today})`,
      html: emailTemplate,
    });

    return NextResponse.json({
      success: true,
      message: "Emel peringatan berjaya dihantar.",
      count: orders.length,
    });
  } catch (err: any) {
    console.error("Ralat Cron Job:", err.message || err);
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
}
