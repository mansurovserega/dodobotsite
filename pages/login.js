import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const [chatId, setChatId] = useState(null);
  const [stateValue, setStateValue] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Константы OAuth (оставил твои значения)
  const CLIENT_ID = "cuD1x";
  const SCOPE =
    "openid deliverystatistics staffmembers:read staffmembersearch staffmembers:write offline_access production incentives sales email employee phone profile roles ext_profile user.role:read organizationstructure productionefficiency orders products stockitems accounting stopsales staffshifts:read unitshifts:read unit:read shared";
  const RESPONSE_TYPE = "code";
  const REDIRECT_URI = "https://dodobot.ru/callback";
  const CODE_CHALLENGE = "eXf5tgpyuKEjN1z9uies_APBJaMV-VdgmRbP2m5L_rs";
  const CODE_CHALLENGE_METHOD = "S256";

  // Берём chat_id из query
  useEffect(() => {
    if (!router.isReady) return;
    const cid = router.query.chat_id;
    if (cid) setChatId(String(cid));
  }, [router.isReady, router.query.chat_id]);

  // Генерим state один раз (когда есть chatId)
  useEffect(() => {
    if (!chatId) return;
    if (stateValue) return;

    const generated = Math.random().toString(36).substring(2, 15);
    setStateValue(generated);
  }, [chatId, stateValue]);

  // Сохраняем пользователя сразу (без выбора домена)
  useEffect(() => {
    if (!chatId || !stateValue) return;

    let cancelled = false;

    (async () => {
      try {
        setIsSaving(true);
        setError("");

        const res = await fetch("/api/save-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            state: stateValue,
            // можно хранить пусто, а можно "Не выбрано" — на твой вкус
            country: "Не выбрано",
          }),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "save-user failed");
        }
      } catch (e) {
        if (!cancelled) setError("Не удалось сохранить сессию. Обновите страницу.");
      } finally {
        if (!cancelled) setIsSaving(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chatId, stateValue]);

  // Собираем ссылку (домен выбирается кнопкой)
  const buildAuthUrl = (domain) => {
    const base = `https://auth.${domain}/connect/authorize`;

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      scope: SCOPE,
      response_type: RESPONSE_TYPE,
      redirect_uri: REDIRECT_URI,
      code_challenge: CODE_CHALLENGE,
      code_challenge_method: CODE_CHALLENGE_METHOD,
      state: stateValue,
    });

    return `${base}?${params.toString()}`;
  };

  const handleRegionClick = async (region) => {
    if (!chatId || !stateValue) return;

    // region: "cng" | "other"
    const domain = region === "cng" ? "dodois.io" : "dodois.com";
    const regionName = region === "cng" ? "СНГ" : "Другие страны";

    try {
      // Если хочешь — обновим country в БД именно выбранным регионом
      await fetch("/api/save-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          state: stateValue,
          country: regionName,
        }),
      }).catch(() => {});

      window.location.href = buildAuthUrl(domain);
    } catch (e) {
      setError("Ошибка перехода на авторизацию. Попробуйте ещё раз.");
    }
  };

  const isReady = useMemo(() => !!chatId && !!stateValue && !isSaving, [chatId, stateValue, isSaving]);

  return (
    <div className="wrap">
      <div className="bg" />
      <div className="noise" />

      <main className="card">
        <div className="title">А Л Ь Т Р О Н</div>
        <div className="line" />

        {!chatId ? (
          <div className="muted">Откройте страницу из Telegram-ссылки с chat_id.</div>
        ) : (
          <>
            <div className="sub">
              Выберите регион, чтобы продолжить авторизацию
            </div>

            <div className="buttons">
              <button
                className="btn"
                disabled={!isReady}
                onClick={() => handleRegionClick("cng")}
              >
                СНГ
              </button>

              <button
                className="btn"
                disabled={!isReady}
                onClick={() => handleRegionClick("other")}
              >
                Другие страны
              </button>
            </div>

            {!isReady && !error && (
              <div className="muted">Подготовка сессии…</div>
            )}

            {error && <div className="error">{error}</div>}
          </>
        )}
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          overflow: hidden;
          position: relative;
          padding: 24px;
          color: #fff;
          font-family: system-ui, -apple-system, "SF Pro Display", Inter, "Segoe UI", sans-serif;
          background: #000;
        }

        /* Технологичный фон (без картинок) */
        .bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(900px 700px at 20% 25%, rgba(220, 0, 0, 0.35), transparent 60%),
            radial-gradient(900px 700px at 80% 70%, rgba(160, 0, 0, 0.22), transparent 62%),
            linear-gradient(135deg, rgba(255, 0, 0, 0.18), transparent 40%),
            linear-gradient(180deg, #120000 0%, #000000 70%);
          transform: scale(1.05);
          filter: saturate(1.1);
        }

        /* Лёгкий "digital-noise" слой */
        .noise {
          position: absolute;
          inset: 0;
          opacity: 0.08;
          background-image:
            radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px);
          background-size: 3px 3px;
          mix-blend-mode: overlay;
          pointer-events: none;
        }

        .card {
          position: relative;
          width: min(460px, 100%);
          padding: 36px 26px 28px;
          text-align: center;
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
          margin: 14px auto 26px;
          background: linear-gradient(90deg, transparent, rgba(255, 30, 30, 0.9), transparent);
        }

        .sub {
          font-size: 14px;
          opacity: 0.72;
          margin-bottom: 22px;
        }

        .buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        /* Кнопка — эстетичная, технологичная, но без "перебора" */
        .btn {
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 999px;
          padding: 14px 14px;
          font-size: 14px;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.92);
          background:
            linear-gradient(180deg, rgba(42, 42, 42, 0.95), rgba(22, 22, 22, 0.95));
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .btn:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 60, 60, 0.32);
          box-shadow:
            0 14px 34px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .btn:active {
          transform: translateY(1px);
        }

        .btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }

        .muted {
          margin-top: 18px;
          font-size: 13px;
          opacity: 0.6;
        }

        .error {
          margin-top: 18px;
          font-size: 13px;
          color: rgba(255, 140, 140, 0.95);
        }

        @media (max-width: 420px) {
          .title { font-size: 20px; }
          .buttons { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}