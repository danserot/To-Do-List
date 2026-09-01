import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { offlineAccount, signInOffline } from "../lib/offlineAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorText("");

    if (signInOffline(email, password)) {
      navigate("/dashboard");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorText(error.message);
      return;
    }

    navigate("/dashboard");
  };

  const handleOfflineLogin = () => {
    signInOffline(offlineAccount.email, offlineAccount.password);
    navigate("/dashboard");
  };

  return (
    <div className="authPage">
      <form className="authCard" onSubmit={handleLogin}>
        <div className="authBrand"><span className="brandMark">F</span><span>Focus</span></div>
        <h2>С возвращением</h2>
        <p className="authSubtitle">Войдите, чтобы продолжить работу с задачами</p>

        <input
          type="email"
          placeholder="Электронная почта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorText && <p className="errorText">{errorText}</p>}

        <button type="submit">Войти</button>

        <div className="authDivider"><span>или</span></div>

        <button className="offlineLoginButton" type="button" onClick={handleOfflineLogin}>
          Продолжить офлайн
        </button>

        <p>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </div>
  );
}
