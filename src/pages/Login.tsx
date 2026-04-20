import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth";
import { getApiErrorMessage } from "../api/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clientInfo, isAuthenticated, isBootstrapping, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isBootstrapping && isAuthenticated) {
    return <Navigate to="/messages" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate((location.state as { from?: string } | null)?.from || "/messages", {
        replace: true,
      });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <section className="login-hero">
        <p className="hero-chip">Plateforme video securisee</p>
        <h1>Envoyez et consultez vos messages video dans un espace client isole.</h1>
        <p className="hero-copy">
          Authentification JWT, verification d'integrite et journalisation des
          actions sensibles pour chaque video.
        </p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-top">
            <span className="sidebar-badge">MS</span>
            <div>
              <p className="sidebar-kicker">Client</p>
              <h2>{clientInfo?.client ?? "Moustass SVM"}</h2>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                autoComplete="username"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@client.local"
                required
                type="email"
                value={email}
              />
            </label>

            <label>
              Mot de passe
              <input
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Votre mot de passe"
                required
                type="password"
                value={password}
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="form-hint">
            Utilise un compte `USER` ou `ADMIN` present dans le backend Moustass.
          </p>
        </div>
      </section>
    </div>
  );
}
