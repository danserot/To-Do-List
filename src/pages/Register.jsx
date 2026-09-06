import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authRepository } from "../services/authRepository";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");
    if (submitting) return;

    setSubmitting(true);
    try {
      const result = await authRepository.register({
        fullName,
        email,
        password,
        confirmPassword,
      });
      if (!result.ok) {
        setErrorText(result.message);
        return;
      }
      if (result.needsConfirmation) {
        setSuccessText(result.message);
        return;
      }
      navigate("/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="authPage">
      <form className="authCard" onSubmit={handleRegister}>
        <div className="authBrand"><span className="brandMark">F</span><span>Focus</span></div>
        <h2>Создать аккаунт</h2>
        <p className="authSubtitle">Зарегистрируйтесь через Supabase, чтобы синхронизировать задачи</p>

        <input
          type="text"
          placeholder="Имя"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Повторите пароль"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {errorText && <p className="errorText">{errorText}</p>}
        {successText && <p className="successText">{successText}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Создаем аккаунт..." : "Зарегистрироваться"}
        </button>

        <p>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </div>
  );
}
