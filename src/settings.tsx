import { Card, CardContent, Stack, Typography } from "@mui/material";
import { Title, useGetIdentity } from "react-admin";

export function SettingsPage() {
  const { identity } = useGetIdentity();

  return (
    <div className="settings-shell">
      <Title title="Configuration" />
      <Card className="admin-card">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5">Configuration de l'admin</Typography>
            <Typography variant="body2">
              Cette console est connectee au backend expose par
              `REACT_APP_API_URL` ou, par defaut, `http://localhost:3001`.
            </Typography>
            <Typography variant="body2">
              Utilisateur courant: {identity?.fullName ?? "Administrateur"}
            </Typography>
            <Typography variant="body2">
              Ressources disponibles: utilisateurs et licences.
            </Typography>
            <Typography variant="body2">
              Le backend ne fournit pas encore de page de parametrage
              applicative ni de listing admin pour les messages video.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </div>
  );
}
