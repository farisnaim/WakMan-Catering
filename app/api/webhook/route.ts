import { NextResponse } from "next/server";

// Tetapkan Verify Token rahsia anda sendiri di sini
const VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || "wakman_secret_token_123";

/**
 * 1. GET Request: Digunakan oleh Meta untuk pengesahan Webhook
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Semak jika mode dan token sepadan dengan rahsia yang kita tetapkan
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Meta berjaya disahkan!");
    // Meta perlukan respons teks biasa (Plain Text) bersama nilai hub.challenge
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Jika token tidak sepadan
  console.error("❌ Kegagalan pengesahan Webhook: Token tidak sah.");
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * 2. POST Request: Menerima data real-time daripada Meta (Mesej, Status, dll.)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Cetak payload yang diterima dari Meta ke terminal untuk tujuan 'debugging'
    console.log("📩 Webhook Payload Diterima:", JSON.stringify(body, null, 2));

    // Pastikan memberi maklum balas HTTP 200 OK dengan pantas kepada Meta
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Ralat memproses Webhook POST:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
