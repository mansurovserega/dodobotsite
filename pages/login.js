import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [chatId, setChatId] = useState(null);
  const [state, setState] = useState(null);
  const [authUrl, setAuthUrl] = useState(null);
  const [country, setCountry] = useState(""); // "kz" | "ae"
  const [bgUrl, setBgUrl] = useState("/images/bg-desktop.jpg");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // chat_id из query
    if (router.query.chat_id) setChatId(router.query.chat_id);

    // выбор фона: mobile / desktop
    const pickBg = () => {
      const isMobile =
        window.matchMedia?.("(max-width: 768px)")?.matches ||
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);

      setBgUrl(isMobile ? "/images/bg-mobile.jpg" : "/images/bg-desktop.jpg");
    };

    pickBg();
    window.addEventListener("resize", pickBg);
    return () => window.removeEventListener("resize", pickBg);
  }, [router.query.chat_id]);

  const handleCountrySelect = async (selected) => {
    if (!chatId) return;

    // СНГ -> kz, Другие страны -> ae
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
      <div className="card">
        <h1>Добро пожаловать 👋</h1>

        {!country ? (
          <>
            <p>Выберите группу стран для авторизации:</p>
            <div className="btnRow">
              <button className="imgBtn" onClick={() => handleCountrySelect("sng")}>
                СНГ
              </button>
              <button className="imgBtn" onClick={() => handleCountrySelect("other")}>
                Другие страны
              </button>
            </div>
          </>
        ) : authUrl ? (
          <>
            <p>
              Вы выбрали:{" "}
              <strong>{country === "kz" ? "СНГ" : "Другие страны"}</strong>
            </p>
            <p>Нажмите кнопку ниже для входа:</p>

            <a href={authUrl} className="imgBtn linkBtn">
              Авторизация
            </a>
          </>
        ) : (
          <p>⏳ Генерация ссылки...</p>
        )}
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 22px;
          text-align: center;
          color: #fff;
          font-family: "Segoe UI", sans-serif;
          box-sizing: border-box;

          /* ФОНЫ */
          background-image: url("${bgUrl}");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        /* чуть затемняем фон, чтобы текст читался */
        .card {
          width: min(520px, 100%);
          padding: 26px 22px;
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        h1 {
          font-size: 2.2rem;
          margin: 0 0 14px;
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

        /* КНОПКИ: фон-картинка button.png */
        .imgBtn {
          appearance: none;
          border: none;
          cursor: pointer;
          color: #fff;
          font-weight: 600;
          font-size: 16px;

          width: 240px;
          max-width: 100%;
          height: 56px;

          background-image: url("/images/button.png");
          background-size: 100% 100%;
          background-repeat: no-repeat;
          background-position: center;

          /* чтобы текст был ровно по центру */
          display: inline-flex;
          align-items: center;
          justify-content: center;

          /* чуть “вдавливаем” текст */
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);

          transition: transform 0.12s ease, filter 0.12s ease;
        }

        .imgBtn:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }

        .imgBtn:active {
          transform: translateY(0px) scale(0.99);
          filter: brightness(0.98);
        }

        .linkBtn {
          text-decoration: none;
          margin-top: 14px;
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 1.7rem;
          }
          .card {
            padding: 22px 16px;
          }
          .imgBtn {
            width: 100%;
            height: 54px;
            font-size: 16px;
          }
        }
      `}</style>

      <style global jsx>{`
        html,
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}