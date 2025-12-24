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

  // ✅ фон выбираем сразу: сначала mobile (норм для iPhone), потом уточняем в useEffect
  const [bgUrl, setBgUrl] = useState("/images/bg-mobile.jpg");

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL; // "/api"
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

  // ✅ фон как на авторизации
  useEffect(() => {
    if (typeof window === "undefined") return;

    const pickBg = () => {
      const isMobile =
        window.matchMedia?.("(max-width: 768px)")?.matches ||
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

      setBgUrl(isMobile ? "/images/bg-mobile.jpg" : "/images/bg-desktop.jpg");
    };

    pickBg();
    window.addEventListener("resize", pickBg);
    return () => window.removeEventListener("resize", pickBg);
  }, []);

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

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const resp = await postWithTimeout(`${serverUrl}/callback`, { state, code });

          if (!resp.ok) {
            setStatus(STATUS.FAIL);
            setDetails(`Код ответа сервера: ${resp.status}`);
            continue;
          }

          const success = resp.data && resp.data.success === true;
          if (success) {
            setStatus(STATUS.OK);
            const { deep } = buildTelegramLink({ botUser, startParam: start });
            setTimeout(() => {
              window.location.href = deep;
            }, autoRedirectMs);
          } else {
            setStatus(STATUS.FAIL);
            setDetails(resp.data?.message || "Сервер не подтвердил авторизацию.");
          }
          return;
        } catch (e) {
          if (e.name === "AbortError") {
            setStatus(STATUS.TIMEOUT);
            setDetails("Превышено время ожидания ответа от сервера.");
          } else {
            setStatus(STATUS.SEND_ERR);
            setDetails(e.message || "Сетевая ошибка.");
          }
        }
      }
    };

    submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, state, code, serverUrl]);

  const tgLink = `https://t.me/${botUser}${start ? `?start=${encodeURIComponent(start)}` : ""}`;

  return (
    <div className="wrap">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Dodo IS — Callback</title>
      </Head>

      <div className="card">
        <div className="logo">Dodo IS</div>

        <h2 className={status === STATUS.OK ? "ok" : status.includes("⚠️") || status.includes("❌") ? "bad" : ""}>
          {status}
        </h2>

        {details ? <p className="muted">{details}</p> : <p className="muted">Не закрывайте страницу — сейчас вернёмся в Telegram.</p>}

        <div className="spinner" aria-hidden />

        <a className="neoBtn" href={tgLink}>
          Открыть Telegram
        </a>

        <p className="hint">
          Если Telegram не открылся автоматически, нажмите кнопку выше или{" "}
          <a href={tgLink}>ссылку</a>.
        </p>
      </div>

      <style jsx global>{`
        html, body, #__next {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: #000; /* запасной */
        }
        :root { color-scheme: dark; }
        @supports (padding: max(0px)) {
          body {
            padding: env(safe-area-inset-top) env(safe-area-inset-right)
                     env(safe-area-inset-bottom) env(safe-area-inset-left);
          }
        }
      `}</style>

      <style jsx>{`
        .wrap {
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: 24px;
          color: #fff;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans;

          /* ✅ фон ставим сюда (НЕ на body) */
          background-image: url("${bgUrl}");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
        }

        /* лёгкое затемнение поверх фона */
        .wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(900px 500px at 50% 30%, rgba(0,0,0,0.20), rgba(0,0,0,0.65));
          z-index: 0;
          pointer-events: none;
        }

        .card {
          position: relative;
          z-index: 1;

          width: min(520px, 100%);
          padding: 26px 22px;
          border-radius: 18px;
          text-align: center;

          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(6px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 44px;
          padding: 0 16px;
          margin-bottom: 10px;
          border-radius: 999px;

          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 0, 0, 0.35);
          box-shadow: 0 0 14px rgba(255, 0, 0, 0.35), inset 0 0 12px rgba(255, 0, 0, 0.18);

          color: #fff;
          font-weight: 800;
        }

        h2 { margin: 10px 0 6px; font-weight: 800; line-height: 1.2; }
        h2.ok { text-shadow: 0 0 14px rgba(0, 255, 120, 0.25); }
        h2.bad { text-shadow: 0 0 14px rgba(255, 0, 0, 0.25); }

        .muted { margin: 0 auto 10px; opacity: 0.86; line-height: 1.4; }

        .spinner {
          width: 28px; height: 28px; border-radius: 50%;
          border: 3px solid rgba(255,255,255,0.25);
          border-top-color: rgba(255,0,0,0.9);
          margin: 14px auto 14px;
          animation: spin 0.9s linear infinite;
        }

        .neoBtn {
          appearance: none;
          border: none;
          cursor: pointer;

          width: 240px;
          max-width: 100%;
          height: 56px;

          background: rgba(0, 0, 0, 0.18);
          border-radius: 999px;

          color: #fff;
          font-weight: 800;
          font-size: 16px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          text-decoration: none;
          margin: 8px auto 0;

          box-shadow:
            0 0 0 1px rgba(255, 0, 0, 0.55),
            0 0 14px rgba(255, 0, 0, 0.55),
            inset 0 0 14px rgba(255, 0, 0, 0.25);

          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }

        .neoBtn:hover {
          transform: translateY(-1px);
          background: rgba(0, 0, 0, 0.26);
          box-shadow:
            0 0 0 1px rgba(255, 0, 0, 0.85),
            0 0 20px rgba(255, 0, 0, 0.85),
            inset 0 0 18px rgba(255, 0, 0, 0.35);
        }

        .neoBtn:active { transform: scale(0.97); }

        .hint { opacity: 0.85; margin-top: 10px; }
        .hint a { color: #fff; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 480px) {
          .card { padding: 22px 16px; }
          .neoBtn { width: 100%; max-width: 280px; height: 54px; }
        }
      `}</style>
    </div>
  );
}