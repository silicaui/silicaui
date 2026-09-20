import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SilicaProvider } from "@wizeworks/silicaui-react";
import "./prefixed.css";
import Collision from "./Collision.jsx";

// Le préfixe doit être donné DEUX fois et avec la même valeur: au greffon, qui
// émet le CSS, et au fournisseur React, qui reconstruit les noms de classes à
// l'exécution. En donner un seul des deux est silencieux.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SilicaProvider prefix="na-">
      <Collision mode="préfixe na-" />
    </SilicaProvider>
  </StrictMode>,
);
