import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [chatId, setChatId] = useState(null);
  const [state, setState] = useState(null);
  const [authUrl, setAuthUrl] = useState(null);
  const [country, setCountry] = useState("");
  const [bgUrl, setBgUrl] = useState("/images/bg-mobile.jpg");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (router.query.chat_id) setChatId(router.query.chat_id);

    const pickBg = () => {
      const isMobile =
        window.matchMedia?.("(max-width: 768px)")?.matches ||
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

      setBgUrl(isMobile ? "/images/bg-mobile.jpg" : "/images/bg-desktop.jpg");
    };

    pickBg();
    window.addEventListener("resize", pickBg);
    window.addEventListener("orientationchange", pickBg);
    window.visualViewport?.addEventListener("resize", pickBg);

    return () => {
      window.removeEventListener("resize", pickBg);
      window.removeEventListener("orientationchange", pickBg);
      window.visualViewport?.removeEventListener("resize", pickBg);
    };
  }, [router.query.chat_id]);

  const handleCountrySelect = async (selected) => {
    if (!chatId) return;

    const selectedCountry = selected === "sng" ? "kz" : "ae";
    setCountry(selectedCountry);

    const generatedState = Math.random().toString(36).substring(2, 15);
    setState(generatedState);

    const countryName = selectedCountry === "kz" ? "Казахстан" : "ОАЭ";

    await fetch("/api/save-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        state: generatedState,
        country: countryName,
      }),
    });

    const domain = selectedCountry === "ae" ? "dodois.com" : "dodois.io";
    const redirectUri = "https://dodobot.ru/callback";

    const authLink = `https://auth.${domain}/connect/authorize?client_id=cuD1x&scope=openid deliverystatistics staffmembers:read staffmembersearch staffmembers:write offline_access production incentives sales email employee phone profile roles ext_profile user.role:read organizationstructure productionefficiency orders products stockitems accounting stopsales staffshifts:read unitshifts:read unit:read shared&response_type=code&redirect_uri=${redirectUri}&code_challenge=eXf5tgpyuKEjN1z9uies_APBJaMV-VdgmRbP2m5L_rs&code_challenge_method=S256&state=${generatedState}`;

    setAuthUrl(authLink);
  };

  return (
    <div className="container">
      {/* ✅ Верхний бренд */}
      <div className="brand" aria-hidden="true">
        <span className="brandText">АЛЬТРОН</span>
      </div>

      <div className="scroll">
        <div className="card">
          <h1>Добро пожаловать 👋</h1>

          {!country ? (
            <>
              <p>Выберите группу стран для авторизации:</p>
              <div className="btnRow">
                <button className="neoBtn" onClick={() => handleCountrySelect("sng")}>
                  СНГ
                </button>
                <button className="neoBtn" onClick={() => handleCountrySelect("other")}>
                  Другие страны
                </button>
              </div>
            </>
          ) : authUrl ? (
            <>
              <p>
                Вы выбрали: <strong>{country === "kz" ? "СНГ" : "Другие страны"}</strong>
              </p>
              <p>Нажмите кнопку ниже для входа:</p>

              <a href={authUrl} className="neoBtn linkBtn">
                Авторизация
              </a>
            </>
          ) : (
            <p>⏳ Генерация ссылки...</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .container {
          position: relative;
          isolation: isolate;
          height: 100vh;
          height: 100dvh;
        }

        /* ✅ фиксированный фон на весь экран (не рвётся при повороте) */
        .container::before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: -2;
          pointer-events: none;

          background-image: url("${bgUrl}");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .container::after {
          content: "";
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: radial-gradient(
            900px 520px at 50% 28%,
            rgba(0, 0, 0, 0.18),
            rgba(0, 0, 0, 0.62)
          );
        }

        /* ✅ Верхний заголовок Альтрон (крупнее + ниже) */
        .brand {
          position: fixed;
          top: calc(34px + env(safe-area-inset-top)); /* было 14px */
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          pointer-events: none;
        }

        .brandText {
          font-family: "Orbitron", system-ui, -apple-system, "Segoe UI", sans-serif;
          font-weight: 900;
          font-size: 30px; /* было 22px */
          letter-spacing: 6px; /* было 4px */
          text-transform: uppercase;
          color: #fff;
          opacity: 0.98;

          text-shadow: 0 0 10px rgba(255, 0, 0, 0.55), 0 0 22px rgba(255, 0, 0, 0.45),
            0 0 42px rgba(255, 0, 0, 0.28);
        }

        /* ✅ safe-area в padding, чтобы при повороте не появлялись чёрные края */
        .scroll {
          height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: none;

          display: flex;
          justify-content: center;
          align-items: center;

          padding: calc(22px + env(safe-area-inset-top))
            calc(22px + env(safe-area-inset-right))
            calc(22px + env(safe-area-inset-bottom))
            calc(22px + env(safe-area-inset-left));

          /* чтобы карточка не залезала под “АЛЬТРОН” */
          padding-top: calc(110px + env(safe-area-inset-top)); /* было 70px */

          box-sizing: border-box;
        }

        .card {
          width: min(520px, 100%);
          padding: 26px 22px;
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(6px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.06);
          text-align: center;
          color: #fff;
          font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        }

        h1 {
          font-family: "Orbitron", system-ui, -apple-system, "Segoe UI", sans-serif;
          font-weight: 700;
          letter-spacing: 0.6px;
          font-size: 2.1rem;
          margin: 0 0 14px;
          text-shadow: 0 0 10px rgba(255, 0, 0, 0.18);
        }

        p {
          margin: 10px 0;
          opacity: 0.95;
        }

        .btnRow {
          margin-top: 18px;
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
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
          font-family: "Orbitron", system-ui, -apple-system, "Segoe UI", sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 1px;
          text-transform: uppercase;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);

          box-shadow: 0 0 0 1px rgba(255, 0, 0, 0.55), 0 0 14px rgba(255, 0, 0, 0.55),
            inset 0 0 14px rgba(255, 0, 0, 0.25);

          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }

        .neoBtn:hover {
          transform: translateY(-1px);
          background: rgba(0, 0, 0, 0.26);
          box-shadow: 0 0 0 1px rgba(255, 0, 0, 0.85), 0 0 20px rgba(255, 0, 0, 0.85),
            inset 0 0 18px rgba(255, 0, 0, 0.35);
        }

        .neoBtn:active {
          transform: scale(0.97);
        }

        .linkBtn {
          text-decoration: none;
          margin-top: 14px;
        }

        @media (max-width: 480px) {
          .brandText {
            font-size: 24px; /* было 18px */
            letter-spacing: 5px; /* было 3px */
          }

          h1 {
            font-size: 1.7rem;
          }

          .card {
            padding: 22px 16px;
          }

          .neoBtn {
            width: 100%;
            max-width: 280px;
            height: 54px;
            font-size: 14px;
          }
        }
      `}</style>

      <style global jsx>{`
        html,
        body,
        #__next {
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #000;
        }

        :root {
          color-scheme: dark;
        }
      `}</style>
    </div>
  );
}