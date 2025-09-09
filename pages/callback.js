// pages/callback.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const STATUS = {
  WAIT: "⏳ Пожалуйста, подождите...",
  PROCESS: "📡 Обработка авторизации...",
  OK: "✅ Авторизация прошла успешно!",
  FAIL: "⚠️ Авторизация не удалась. Попробуйте снова.",
  MISSING: "❌ Отсутствуют параметры авторизации.",
  SEND_ERR: "❌ Ошибка при отправке запроса.",
  TIMEOUT: "⏱️ Сервер долго не отвечает. Проверьте подключение и попробуйте снова.",
};

function buildTelegramLink({ botUser, startParam }) {
  const deep = startParam
    ? `tg://resolve?domain=${botUser}&start=${encodeURIComponent(startParam)}`
    : `tg://resolve?domain=${botUser}`;
  const web = startParam
    ? `https://t.me/${botUser}?start=${encodeURIComponent(startParam)}`
    : `https://t.me/${botUser}`;
  return { deep, web };
}

async function postWithTimeout(url, body, { timeoutMs = 12000 } = {}) {
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

export default function Callback() {
  const router = useRouter();
  const [status, setStatus] = useState(STATUS.WAIT);
  const [details, setDetails] = useState("");

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL; // ДОЛЖНО быть "/api"
  const botUser = process.env.NEXT_PUBLIC_BOT_USERNAME || "managerdodo_bot";
  const autoRedirectMs = 1500;

  const { state, code, start } = useMemo(() => {
    if (!router.isReady) return {};
    const q = router.query || {};
    return {
      state: Array.isArray(q.state) ? q.state[0] : q.state,
      code: Array.isArray(q.code) ? q.code[0] : q.code,
      start: Array.isArray(q.start) ? q.start[0] : q.start,
    };
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (!router.isReady) return;

    if (!state || !code) {
      setStatus(STATUS.MISSING);
      setDetails("Не найден один из параметров: state, code.");
      return;
    }
    if (!serverUrl) {
      setStatus(STATUS.SEND_ERR);
      setDetails("NEXT_PUBLIC_SERVER_URL не задан в окружении фронтенда.");
      return;
    }

    const submit = async () => {
      setStatus(STATUS.PROCESS);
      setDetails("");

      const maxAttempts = 2;
      let lastErr = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          // ВНИМАНИЕ: постим на свой Next.js API → /api/callback
          const resp = await postWithTimeout(`${serverUrl}/callback`, { state, code });
          if (!resp.ok) {
            setDetails(`Код ответа сервера: ${resp.status}`);
            lastErr = new Error(`HTTP ${resp.status}`);
          } else {
            const success = resp.data && resp.data.success === true;
            if (success) {
              setStatus(STATUS.OK);
              const { deep } = buildTelegramLink({ botUser, startParam: start });
              setTimeout(() => {
                window.location.href = deep;
              }, autoRedirectMs);
            } else {
              setStatus(STATUS.FAIL);
              setDetails(resp.data?.message || "Сервер не подтвердил авторизацию. Проверьте state/code.");
            }
            return;
          }
        } catch (e) {
          lastErr = e;
          if (e.name === "AbortError") {
            setStatus(STATUS.TIMEOUT);
            setDetails("Превышено время ожидания ответа от сервера.");
          } else {
            setStatus(STATUS.SEND_ERR);
            setDetails(e.message || "Сетевая ошибка.");
          }
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      if (lastErr && status === STATUS.PROCESS) {
        setStatus(STATUS.FAIL);
        setDetails("Не удалось завершить авторизацию. Попробуйте ещё раз.");
      }
    };

    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, state, code, serverUrl]);

  return (
    <div className="wrap">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="card">
        <div className="logo">Dodo IS</div>
        <h2>{status}</h2>
        {details ? <p className="muted">{details}</p> : null}
        <div className="spinner" aria-hidden />
        <p className="hint">
          Если Telegram не открылся автоматически,{" "}
          <a href={`https://t.me/${botUser}${start ? `?start=${encodeURIComponent(start)}` : ""}`}>
            нажмите здесь
          </a>.
        </p>
      </div>

      {/* Глобальный фон + safe area (убираем белые края везде) */}
      <style jsx global>{`
        html, body, #__next {
          height: 100%;
          min-height: 100%;
          margin: 0;
          overflow-x: hidden;
          background: #0f2027;
        }
        body::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background:
            radial-gradient(1200px 600px at 80% -10%, rgba(255, 102, 0, 0.25), transparent),
            radial-gradient(1200px 600px at 10% 110%, rgba(44, 83, 100, 0.35), transparent),
            linear-gradient(135deg, #0f2027, #203a43 48%, #2c5364);
        }
        @supports (padding: max(0px)) {
          body {
            padding: env(safe-area-inset-top) env(safe-area-inset-right)
                     env(safe-area-inset-bottom) env(safe-area-inset-left);
          }
        }
        :root { color-scheme: dark; }
      `}</style>

      <style jsx>{`
        .wrap {
          min-height: 100dvh;   /* корректнее для мобильных, чем 100vh */
          display: grid;
          place-items: center;
          padding: 24px;
          color: #fff;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans,
            "Apple Color Emoji", "Segoe UI Emoji";
        }
        .card {
          width: min(680px, 100%);
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(12px);
          padding: 28px 28px 18px;
          text-align: center;
        }
        .logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 16px;
          margin-bottom: 10px;
          border-radius: 999px;
          background: #ff6600;
          color: #fff;
          font-weight: 700;
          letter-spacing: 0.2px;
          box-shadow: 0 6px 24px rgba(255, 102, 0, 0.35);
        }
        h2 { margin: 10px 0 6px; font-weight: 700; }
        .muted { margin: 0 auto 10px; opacity: .8; max-width: 520px; line-height: 1.4; }
        .spinner {
          width: 28px; height: 28px; border-radius: 50%;
          border: 3px solid rgba(255,255,255,.35); border-top-color: #fff;
          margin: 16px auto 6px; animation: spin .9s linear infinite;
        }
        .hint { opacity: .85; margin-top: 6px; }
        .hint a { color: #fff; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
