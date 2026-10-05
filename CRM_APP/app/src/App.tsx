import { useEffect } from "react";
import { href, navigate, ROUTES, useRoute } from "./router.ts";

export function App() {
	const route = useRoute();
	useEffect(() => {
		document.documentElement.lang = "ar";
		document.documentElement.dir = "rtl";
	}, []);
	return (
		<main>
			<h1>Systronic CRM</h1>
			<nav aria-label="Primary">
				{ROUTES.map((r) => (
					<a
						key={r}
						href={href(r)}
						aria-current={r === route ? "page" : undefined}
						onClick={(e) => {
							e.preventDefault();
							navigate(r);
						}}
					>
						{r}
					</a>
				))}
			</nav>
			<p data-testid="route">{route ?? "not-found"}</p>
		</main>
	);
}
