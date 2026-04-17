import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import {
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Typography,
} from "@mui/material";
import {
  AppBar,
  Layout,
  Menu,
  type AppBarProps,
  type LayoutProps,
  type MenuProps,
  useGetIdentity,
} from "react-admin";
import { Link } from "react-router-dom";

const BrandAppBar = (props: AppBarProps) => {
  const { identity } = useGetIdentity();

  return (
    <AppBar {...props}>
      <Box className="brand-bar">
        <Box className="brand-lockup">
          <span className="brand-badge">MS</span>
          <Box>
            <Typography className="brand-title" variant="subtitle1">
              Moustass Admin
            </Typography>
            <Typography className="brand-subtitle" variant="caption">
              Console securisee du client
            </Typography>
          </Box>
        </Box>
        <Typography className="brand-user" variant="body2">
          {identity?.fullName ?? "Administrateur"}
        </Typography>
      </Box>
    </AppBar>
  );
};

const AdminMenu = (props: MenuProps) => (
  <Menu {...props}>
    <Menu.DashboardItem />
    <Menu.ResourceItem name="users" />
    <Menu.ResourceItem name="license" />
    <Divider />
    <MenuItem component={Link} to="/settings">
      <ListItemIcon>
        <SettingsOutlinedIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Configuration</ListItemText>
    </MenuItem>
  </Menu>
);

export const AdminLayout = (props: LayoutProps) => (
  <Layout {...props} appBar={BrandAppBar} menu={AdminMenu} />
);

export const AdminLogo = () => (
  <Box className="menu-logo">
    <ShieldOutlinedIcon fontSize="small" />
    <Typography variant="body2">Moustass</Typography>
  </Box>
);
