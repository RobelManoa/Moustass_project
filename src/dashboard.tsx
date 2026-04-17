import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useGetIdentity, useGetList } from "react-admin";

function MetricCard(props: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card className="admin-card">
      <CardContent>
        <Typography className="metric-label" variant="overline">
          {props.label}
        </Typography>
        <Typography className="metric-value" variant="h3">
          {props.value}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {props.helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { identity } = useGetIdentity();
  const { data: users = [], isPending: usersPending } = useGetList("users", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "createdAt", order: "DESC" },
    filter: {},
  });
  const { data: licenses = [], isPending: licensesPending } = useGetList("license", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "createdAt", order: "DESC" },
    filter: {},
  });

  const activeLicenses = licenses.filter((license) => license.status === "ACTIVE").length;
  const adminCount = users.filter((user) => user.role === "ADMIN").length;

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <Typography className="hero-kicker" variant="overline">
            Administration securisee
          </Typography>
          <Typography className="hero-title" variant="h2">
            Pilotez Moustass depuis un poste unique.
          </Typography>
          <Typography className="hero-copy" variant="body1">
            Gestion des comptes, des licences et du contexte SaaS avec une vue
            orientee exploitation.
          </Typography>
        </div>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`Connecte: ${identity?.fullName ?? "Admin"}`} />
          <Chip label="React-admin" variant="outlined" />
          <Chip label="JWT + RBAC" variant="outlined" />
        </Stack>
      </section>

      <section className="dashboard-grid">
        <MetricCard
          label="Utilisateurs"
          value={usersPending ? "..." : users.length}
          helper="Comptes disponibles dans cette instance client."
        />
        <MetricCard
          label="Administrateurs"
          value={usersPending ? "..." : adminCount}
          helper="Utilisateurs ayant les droits d'administration."
        />
        <MetricCard
          label="Licences"
          value={licensesPending ? "..." : licenses.length}
          helper="Licences connues par le backend."
        />
        <MetricCard
          label="Licences actives"
          value={licensesPending ? "..." : activeLicenses}
          helper="Souscriptions actuellement exploitables."
        />
      </section>

      <section className="dashboard-panels">
        <Card className="admin-card">
          <CardHeader title="Priorites admin" />
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="body2">
                Creez les administrateurs, gerez les comptes metier et maintenez
                le parc de licences client.
              </Typography>
              <Typography variant="body2">
                Le backend actuel expose le CRUD complet pour les utilisateurs et
                les licences via des endpoints proteges par JWT.
              </Typography>
              <Typography variant="body2">
                Les videos sont securisees cote API, mais il n'existe pas encore
                de route de listing admin pour construire une grille React-admin
                fiable sur cette ressource.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardHeader title="Ressources branchees" />
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="body2">
                `POST /auth/login` pour la connexion admin
              </Typography>
              <Typography variant="body2">
                `GET|POST|PUT|DELETE /users` pour les comptes
              </Typography>
              <Typography variant="body2">
                `GET|POST|PUT|DELETE /license` pour les licences
              </Typography>
              <Typography variant="body2">
                `GET /info` reste exploitable pour une future page de contexte
                locataire
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
