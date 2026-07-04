
  import { createRoot } from "react-dom/client";
  import { ThemeProvider } from "next-themes";
  import App from "./App";
  import { AuthProvider } from "./contexts/AuthContext";
  import { ToastProvider } from "./components/ToastProvider";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
  