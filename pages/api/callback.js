import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" });
  }

  try {
    const { state, code } = req.body;

    console.log("📥 Входящий запрос:", { state, code });

    if (!state || !code) {
      console.error("❌ Ошибка: отсутствует state или code.");
      return res.status(400).json({ error: "Отсутствует state или code" });
    }

    // Проверяем, существует ли state в БД
    console.log(`🔍 Поиск chat_id по state=${state} в БД...`);
    const querySelect = `SELECT chat_id FROM users WHERE state = $1`;
    const client = await pool.connect();
    const result = await client.query(querySelect, [state]);

    if (result.rows.length === 0) {
      console.warn(`⚠️ Не найден chat_id для state=${state}`);
      client.release();
      return res.status(404).json({ error: "state не найден в БД" });
    }

    const chat_id = result.rows[0].chat_id;
    console.log(`✅ Найден chat_id=${chat_id}, отправляем данные в server.py...`);

    client.release();

    // Отправляем `state` и `code` на `server.py`
    const serverUrl = process.env.SERVER_URL + "/callback"; // Добавь SERVER_URL в ENV переменные
    const response = await fetch(serverUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, code }),
    });

    const serverResponse = await response.json();
    console.log("📨 Ответ от server.py:", serverResponse);

    return res.status(200).json({ message: "Код успешно передан в server.py!" });

  } catch (error) {
    console.error("❌ Ошибка обработки запроса:", error);
    return res.status(500).json({ error: "Ошибка сервера" });
  }
}