// pages/api/callback.js
import { Pool } from "pg";

// Подключение к PostgreSQL (та же БД, что использует бот)
const pool = new Pool({
  connectionString: process.env.DB_URL,          // например: postgres://user:pass@127.0.0.1:5432/dodobot
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// утилита: POST с таймаутом
async function postJsonWithTimeout(url, body, { timeoutMs = 12000 } = {}) {
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
    try { data = await res.json(); } catch (_) {}
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(id);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    // Страница /callback делает POST сюда из браузера
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    const { state, code } = req.body || {};
    if (!state || !code) {
      return res.status(400).json({ error: "Отсутствует state или code" });
    }

    const client = await pool.connect();
    try {
      // Ищем chat_id, который мы предварительно сохранили в /api/save-user
      const q = `SELECT chat_id FROM users WHERE state = $1 LIMIT 1`;
      const r = await client.query(q, [String(state).trim()]);
      if (r.rows.length === 0) {
        return res.status(404).json({ error: "state не найден в БД" });
      }
      const chat_id = r.rows[0].chat_id;

      // Шлём в Python backend (server.py) на /callback
      const base = process.env.SERVER_URL; // например: http://127.0.0.1:5000  или https://api.dodobot.ru
      if (!base) {
        return res.status(500).json({ error: "SERVER_URL не задан в окружении" });
      }

      const resp = await postJsonWithTimeout(`${base}/callback`, { chat_id, code }, { timeoutMs: 15000 });

      // Успех считаем по HTTP 200..299 и success/message в ответе
      const okByMessage = resp.data && (resp.data.success === true || /успеш/i.test(resp.data.message || ""));
      if (resp.ok && okByMessage) {
        return res.status(200).json({ success: true, message: "Авторизация успешно завершена!" });
      } else {
        return res.status(502).json({
          error: "Backend callback не подтвердил авторизацию",
          status: resp.status,
          backend: resp.data || null,
        });
      }
    } finally {
      client.release();
    }
  } catch (err) {
    // timeouts/abort/сетевые/прочие
    return res.status(500).json({ error: "Ошибка сервера", details: err?.message || String(err) });
  }
}
