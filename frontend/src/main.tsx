import { createRoot } from "react-dom/client";
import { TamboProvider } from "@tambo-ai/react";
import App from "./App";
import "./index.css";
import { components } from "./lib/tambo";

createRoot(document.getElementById("root")!).render(
  <TamboProvider 
    apiKey={import.meta.env.VITE_TAMBO_API_KEY}
    userKey="property-buyer"
    components={components}
  >
    <App />
  </TamboProvider>
);
