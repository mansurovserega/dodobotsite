// pages/api/save-user.js
import { Pool } from "pg";

// 1) ENV
// DB_URL=postgres://user:pass@host:5432/dbname
const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false },
});

// небольшая утилита: безопасно парсим chat_id
function parseChatId(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!/^-?\d+$/.test(s)) return null;
  const n = Number(s);
  // chat_id у Телеграма может быть отрицательным/большим — храним в BIGINT
  return Number.isFinite(n) ? n : null;
}

// нормализуем страну
function normalizeCountry(country) {
  if (!country) return null;
  const c = String(country).trim().toLowerCase();
  if (c === "kz" || c === "казахстан") return "Казахстан";
  if (c === "ae" || c === "оаэ" || c === "оае") return "ОАЭ";
  // при необходимости можно расширить список
  return null;
}

// ограничим длину state
function sanitizeState(state) {
  if (!state) return null;
  const s = String(state).trim();
  if (s.length === 0 || s.length > 256) return null;
  return s;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    const { chat_id, state, country } = req.body || {};
    console.log("📥 /api/save-user payload:", req.body);

    const chatId = parseChatId(chat_id);
    const normCountry = normalizeCountry(country);
    const safeState = sanitizeState(state);

    if (!chatId || !safeState || !normCountry) {
      return res.status(400).json({
        error: "Некорректные данные",
        details:
          "Проверьте chat_id (число), state (1..256 символов) и country (kz/ae или Казахстан/ОАЭ).",
      });
    }

    // UPSERT в users: chat_id PK/UNIQUE
    // Если у тебя уже есть другие колонки в users — этот запрос их не трогает
    const sql = `
      INSERT INTO users (chat_id, state, country, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (chat_id) DO UPDATE
      SET state = EXCLUDED.state,
          country = EXCLUDED.country,
          updated_at = NOW()
    `;

    const client = await pool.connect();
    try {
      await client.query(sql, [chatId, safeState, normCountry]);
    } finally {
      client.release();
    }

    console.log("✅ Пользователь сохранён:", { chatId, normCountry });
    return res.status(200).json({ message: "Пользователь сохранен!" });
  } catch (err) {
    console.error("❌ Ошибка /api/save-user:", err);
    return res
      .status(500)
      .json({ error: "Ошибка сервера", details: err?.message || String(err) });
  }
}
