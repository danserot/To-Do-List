import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { offlineAccount, signInOffline } from "../lib/offlineAuth";
import { authRepository } from "../services/authRepository";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorText("");
    if (submitting) return;

    if (signInOffline(email, password)) {
      navigate("/dashboard");
      return;
    }

    setSubmitting(true);
    try {
      const result = await authRepository.login({ email, password });
      if (!result.ok) {
        setErrorText(result.message);
        return;
      }
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
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
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Пароль"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorText && <p className="errorText">{errorText}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Входим..." : "Войти"}
        </button>

        <div className="authDivider"><span>или</span></div>

        <button className="offlineLoginButton" type="button" disabled={submitting} onClick={handleOfflineLogin}>
          Продолжить офлайн
        </button>

        <p>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </div>
  );
}
