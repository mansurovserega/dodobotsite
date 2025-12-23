import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();

  const [chatId, setChatId] = useState(null);
  const [stateValue, setStateValue] = useState(null);
  const [authUrl, setAuthUrl] = useState(null);
  const [region, setRegion] = useState(""); // "cng" | "other"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.chat_id) setChatId(String(router.query.chat_id));
  }, [router.isReady, router.query.chat_id]);

  const handleRegionSelect = async (selected) => {
    if (!chatId) return;

    setLoading(true);
    setRegion(selected);

    const generatedState = Math.random().toString(36).substring(2, 15);
    setStateValue(generatedState);

    const regionName = selected === "cng" ? "СНГ" : "Другие страны";

    await fetch("/api/save-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        state: generatedState,
        country: regionName,
      }),
    });

    const domain = selected === "other" ? "dodois.com" : "dodois.io";
    const redirectUri = "https://dodobot.ru/callback";

    const authLink =
      `https://auth.${domain}/connect/authorize` +
      `?client_id=cuD1x` +
      `&scope=${encodeURIComponent(
        "openid deliverystatistics staffmembers:read staffmembersearch staffmembers:write offline_access production incentives sales email employee phone profile roles ext_profile user.role:read organizationstructure productionefficiency orders products stockitems accounting stopsales staffshifts:read unitshifts:read unit:read shared"
      )}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code_challenge=eXf5tgpyuKEjN1z9uies_APBJaMV-VdgmRbP2m5L_rs` +
      `&code_challenge_method=S256` +
      `&state=${encodeURIComponent(generatedState)}`;

    setAuthUrl(authLink);
    setLoading(false);
  };

  return (
    <div className="wrap">
      <div className="bg" />
      <div className="noise" />

      <main className="card">
        <div className="title">А Л Ь Т Р О Н</div>
        <div className="line" />

        {!region ? (
          <>
            <div className="sub">Выберите регион для авторизации</div>

            <div className="buttons">
              <button
                className="btn"
                onClick={() => handleRegionSelect("cng")}
                disabled={!chatId || loading}
              >
                СНГ
              </button>

              <button
                className="btn"
                onClick={() => handleRegionSelect("other")}
                disabled={!chatId || loading}
              >
                Другие страны
              </button>
            </div>

            {!chatId && (
              <div className="muted">
                Открой страницу по ссылке с <b>chat_id</b>.
              </div>
            )}

            {loading && <div className="muted">⏳ Подготовка…</div>}
          </>
        ) : authUrl ? (
          <>
            <div className="sub">
              Вы выбрали:{" "}
              <b>{region === "cng" ? "СНГ" : "Другие страны"}</b>
            </div>

            <a className="auth" href={authUrl}>
              Авторизация
            </a>

            <button
              className="link"
              onClick={() => {
                setRegion("");
                setAuthUrl(null);
                setStateValue(null);
              }}
            >
              ← Назад
            </button>
          </>
        ) : (
          <div className="muted">⏳ Генерация ссылки…</div>
        )}
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          position: relative;
          overflow: hidden;
          padding: 24px;
          color: #fff;
          font-family: system-ui, -apple-system, "SF Pro Display", Inter,
            "Segoe UI", sans-serif;
          background: #000;
        }

        /* технологичный тёмно-красный/чёрный фон */
        .bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              900px 700px at 22% 22%,
              rgba(220, 0, 0, 0.35),
              transparent 60%
            ),
            radial-gradient(
              900px 700px at 78% 72%,
              rgba(160, 0, 0, 0.22),
              transparent 62%
            ),
            linear-gradient(135deg, rgba(255, 0, 0, 0.16), transparent 42%),
            linear-gradient(180deg, #120000 0%, #000 72%);
          filter: saturate(1.1);
          transform: scale(1.05);
        }

        /* лёгкий цифровой шум */
        .noise {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image: radial-gradient(
            rgba(255, 255, 255, 0.6) 1px,
            transparent 1px
          );
          background-size: 3px 3px;
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        .card {
          position: relative;
          width: min(460px, 100%);
          text-align: center;
          padding: 30px 20px 18px;
        }

        .title {
          font-size: 22px;
          letter-spacing: 0.42em;
          opacity: 0.92;
          text-shadow: 0 0 22px rgba(255, 0, 0, 0.14);
        }

        .line {
          width: 64px;
          height: 1px;
          margin: 14px auto 24px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 30, 30, 0.9),
            transparent
          );
        }

        .sub {
          font-size: 14px;
          opacity: 0.72;
          margin-bottom: 18px;
        }

        .buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .btn {
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          padding: 14px 14px;
          font-size: 14px;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.92);
          background: linear-gradient(
            180deg,
            rgba(42, 42, 42, 0.95),
            rgba(22, 22, 22, 0.95)
          );
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease,
            box-shadow 160ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .btn:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 60, 60, 0.32);
        }

        .btn:active {
          transform: translateY(1px);
        }

        .btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }

        .auth {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: min(340px, 100%);
          margin: 6px auto 0;
          padding: 14px 18px;
          border-radius: 999px;
          text-decoration: none;
          color: #fff;
          letter-spacing: 0.04em;
          background: linear-gradient(180deg, #b10000, #6f0000);
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 80, 80, 0.25);
          transition: transform 160ms ease;
        }

        .auth:hover {
          transform: translateY(-1px);
        }

        .auth:active {
          transform: translateY(1px);
        }

        .muted {
          margin-top: 16px;
          font-size: 13px;
          opacity: 0.6;
        }

        .link {
          margin-top: 14px;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border: none;
          cursor: pointer;
          font-size: 13px;
        }

        @media (max-width: 420px) {
          .buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}