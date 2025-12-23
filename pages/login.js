import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [chatId, setChatId] = useState(null);
  const [state, setState] = useState(null);
  const [authUrl, setAuthUrl] = useState(null);
  const [country, setCountry] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (router.query.chat_id) {
      setChatId(router.query.chat_id);
    }
  }, [router.query.chat_id]);

  const handleCountrySelect = async (selectedCountry) => {
    if (!chatId) return;

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
    const redirectUri = "https://dodobot.ru/callback"; // 👈 здесь твой Timeweb-домен

    const authLink = `https://auth.${domain}/connect/authorize?client_id=cuD1x&scope=openid deliverystatistics staffmembers:read staffmembersearch staffmembers:write offline_access production incentives sales email employee phone profile roles ext_profile user.role:read organizationstructure productionefficiency orders products stockitems accounting stopsales staffshifts:read unitshifts:read unit:read shared&response_type=code&redirect_uri=${redirectUri}&code_challenge=eXf5tgpyuKEjN1z9uies_APBJaMV-VdgmRbP2m5L_rs&code_challenge_method=S256&state=${generatedState}`;
    setAuthUrl(authLink);
  };

  return (
    <div className="container">
      <h1>Добро пожаловать 👋</h1>

      {!country ? (
        <>
          <p>Выберите вашу страну для авторизации:</p>
          <select onChange={(e) => handleCountrySelect(e.target.value)}>
            <option value="">— Выбрать страну —</option>
            <option value="kz">🇰🇿 Казахстан</option>
            <option value="ae">🇦🇪 ОАЭ</option>
          </select>
        </>
      ) : authUrl ? (
        <>
          <p>Вы выбрали: <strong>{country === "kz" ? "Казахстан" : "ОАЭ"}</strong></p>
          <p>Нажмите кнопку ниже для входа:</p>
          <a href={authUrl} className="auth-button">Авторизоваться через Dodo IS</a>
        </>
      ) : (
        <p>⏳ Генерация ссылки...</p>
      )}

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          text-align: center;
          color: #fff;
          font-family: 'Segoe UI', sans-serif;
          box-sizing: border-box;
        }

        h1 {
          font-size: 2.4rem;
          margin-bottom: 20px;
        }

        select {
          padding: 12px 16px;
          font-size: 16px;
          border-radius: 12px;
          border: none;
          background-color: #1e1e1e;
          color: #fff;
          margin-top: 20px;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          transition: 0.2s;
        }

        select:hover {
          background-color: #2a2a2a;
        }

        .auth-button {
          display: inline-block;
          margin-top: 30px;
          padding: 14px 32px;
          font-size: 17px;
          background-color: #ff6600;
          border-radius: 28px;
          color: #fff;
          text-decoration: none;
          transition: 0.3s ease;
          box-shadow: 0 4px 15px rgba(255, 102, 0, 0.4);
        }

        .auth-button:hover {
          background-color: #e65800;
        }

        @media (max-width: 480px) {
          .container {
            padding: 30px 20px;
          }
          h1 {
            font-size: 1.8rem;
          }
          .auth-button {
            font-size: 16px;
            padding: 12px 24px;
          }
          select {
            width: 100%;
          }
        }
      `}</style>

      <style global jsx>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
          background: linear-gradient(to right, #0f2027, #203a43, #2c5364);
        }
      `}</style>
    </div>
  );