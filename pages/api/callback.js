// pages/api/callback.js
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function postJson(url, body, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    let data = null;
    try { data = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  const { state, code } = req.body || {};
  if (!state || !code) {
    return res.status(400).json({ error: "Отсутствует state или code" });
  }
  if (!process.env.SERVER_URL) {
    return res.status(500).json({ error: "SERVER_URL не задан" });
  }

  let client;
  try {
    client = await pool.connect();

    // 1) Ищем chat_id по state (он сохранялся в /api/save-user)
    const q = `SELECT chat_id FROM users WHERE state = $1 LIMIT 1`;
    const r = await client.query(q, [String(state).trim()]);
    if (r.rows.length === 0) {
      console.warn("[/api/callback] state не найден в БД:", state);
      return res.status(404).json({ error: "state не найден в БД" });
    }
    const chat_id = r.rows[0].chat_id;

    console.log("[/api/callback] -> backend /callback payload:", { chat_id, state, code });

    // 2) Шлём в Python backend ВСЕ ТРИ поля
    const url = `${process.env.SERVER_URL.replace(/\/+$/, "")}/callback`;
    const resp = await postJson(url, { chat_id, state, code });

    console.log("[/api/callback] <- backend response:", resp.status, resp.data);

    // 3) Успех — если код 2xx и success/message об успехе
    const okByMsg =
      resp.data && (resp.data.success === true || /успеш/i.test(resp.data.message || ""));
    if (resp.ok && okByMsg) {
      return res.status(200).json({ success: true, message: "Авторизация успешно завершена!" });
    }

    // Пробрасываем детали, чтобы на фронте видеть «Код ответа сервера: ...»
    return res.status(502).json({
      error: "Backend не подтвердил авторизацию",
      status: resp.status,
      backend: resp.data || null,
    });
  } catch (e) {
    console.error("[/api/callback] fatal:", e);
    return res.status(500).json({ error: "Ошибка сервера", details: e?.message || String(e) });
  } finally {
    if (client) client.release();
  }
}
