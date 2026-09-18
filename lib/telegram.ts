// lib/telegram.ts

export interface InlineButton {
  text: string;
  url: string;
}

export async function sendTelegramGroupMessage(
  message: string,
  buttons?: InlineButton[][],
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn(
      "TELEGRAM_BOT_TOKEN atau TELEGRAM_ADMIN_CHAT_ID belum ditetapkan.",
    );
    return;
  }

  const body: any = {
    chat_id: chatId,
    text: message,
    parse_mode: "HTML",
  };

  if (buttons && buttons.length > 0) {
    body.reply_markup = { inline_keyboard: buttons };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gagal hantar mesej Telegram:", errText);
    }
  } catch (err) {
    console.error("Ralat rangkaian Telegram:", err);
  }
}
