
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, UserRound, Zap } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Login.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Parola trebuie să conțină cel puțin 8 caractere.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Parolele nu coincid.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
    });

    if (error) {
      setError(error.message);
    } else if (!data.session) {
      setSuccess(
        "Verifică emailul pentru confirmarea contului. După confirmare, te poți conecta."
      );
    } else {
      setSuccess("Cont creat cu succes!");
    }

    setLoading(false);
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <Zap size={27} fill="currentColor" />
          </div>
          <div>
            <strong>GREEN<span>ENERGY</span></strong>
            <small>MONITORING SYSTEM</small>
          </div>
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">GET STARTED</span>
          <h1>Creează un cont</h1>
          <p>Înregistrează-te pentru a utiliza platforma Green Energy.</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <label htmlFor="register-name">Nume complet</label>
          <div className="auth-input">
            <UserRound size={19} />
            <input
              id="register-name"
              type="text"
              placeholder="Nume și prenume"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <label htmlFor="register-email">Adresă de email</label>
          <div className="auth-input">
            <Mail size={19} />
            <input
              id="register-email"
              type="email"
              placeholder="nume@exemplu.ro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="register-password">Parolă</label>
          <div className="auth-input">
            <Lock size={19} />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 caractere"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="auth-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          <label htmlFor="register-confirm">Confirmă parola</label>
          <div className="auth-input">
            <Lock size={19} />
            <input
              id="register-confirm"
              type={showPassword ? "text" : "password"}
              placeholder="Reintrodu parola"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Se creează contul..." : "Creează cont"}
          </button>
        </form>

        <p className="auth-footer">
          Ai deja un cont? <Link to="/login">Conectează-te</Link>
        </p>
      </div>
    </div>
  );
}
