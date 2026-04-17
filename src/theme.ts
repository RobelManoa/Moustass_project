import { defaultTheme } from "react-admin";

export const theme = {
  ...defaultTheme,
  palette: {
    mode: "light" as const,
    primary: {
      main: "#123c69",
      light: "#3f6794",
      dark: "#0b2541",
      contrastText: "#f8fbff",
    },
    secondary: {
      main: "#d17a22",
      light: "#e49c52",
      dark: "#9e5a16",
      contrastText: "#fff9f2",
    },
    background: {
      default: "#f4efe6",
      paper: "#fffdf8",
    },
    text: {
      primary: "#15202b",
      secondary: "#5e6b78",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily:
      '"Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h2: {
      fontWeight: 800,
    },
    h3: {
      fontWeight: 800,
    },
    h4: {
      fontWeight: 800,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 22px 60px rgba(11, 37, 65, 0.10)",
        },
      },
    },
    RaDataTable: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },
  },
};
