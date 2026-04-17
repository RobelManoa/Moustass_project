import { FormEvent, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import { useLogin } from "react-admin";

export function AdminLoginPage() {
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({
        username: email,
        password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <CardContent>
          <div className="login-header">
            <span className="login-badge">MS</span>
            <div>
              <Typography className="login-kicker" variant="overline">
                Plateforme video securisee
              </Typography>
              <Typography className="login-title" variant="h4">
                Espace administration
              </Typography>
            </div>
          </div>

          <Typography className="login-copy" variant="body2">
            Connectez-vous avec un compte `ADMIN` du backend Moustass pour gerer
            les utilisateurs et les licences de votre instance client.
          </Typography>

          <Box component="form" className="login-form" onSubmit={handleSubmit}>
            <TextField
              autoComplete="username"
              fullWidth
              label="Email"
              margin="normal"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
            <TextField
              autoComplete="current-password"
              fullWidth
              label="Mot de passe"
              margin="normal"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Button
              className="login-submit"
              disabled={isSubmitting}
              fullWidth
              size="large"
              type="submit"
              variant="contained"
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </div>
  );
}
