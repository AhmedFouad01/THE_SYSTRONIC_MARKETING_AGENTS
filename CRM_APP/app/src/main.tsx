import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { readAuthLink } from "./features/auth/link.ts";
const authLink = readAuthLink();

const root = document.getElementById("root");
if (!root) throw new Error("ROOT_MISSING");
createRoot(root).render(
	<StrictMode>
		<App authLink={authLink} />
	</StrictMode>,
);
