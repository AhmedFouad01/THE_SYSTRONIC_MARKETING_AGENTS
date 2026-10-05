import "./App.css";
import { href, navigate, ROUTES, useRoute } from "./router.ts";
import { I18nProvider, ThemeProvider, useI18n, useTheme } from "./ui/index.ts";

// Placeholder shell: proves providers + toggles. The real AppShell (nav, bottom nav, connect gate) is S2.
function Shell() {
	const route = useRoute();
	const { t, toggleLocale } = useI18n();
	const { mode, toggleMode } = useTheme();
	return (
		<main className="app-shell">
			<header className="app-bar">
				<h1>{t("app.name")}</h1>
				<div className="app-toggles">
					<button
						type="button"
						className="app-toggle"
						data-testid="locale-toggle"
						onClick={toggleLocale}
					>
						{t("locale.switchTo")}
					</button>
					<button
						type="button"
						className="app-toggle"
						data-testid="theme-toggle"
						onClick={toggleMode}
					>
						{mode === "dark"
							? t("theme.switchToLight")
							: t("theme.switchToDark")}
					</button>
				</div>
			</header>
			<nav aria-label={t("nav.primary")} className="app-nav">
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

export function App() {
	return (
		<ThemeProvider>
			<I18nProvider>
				<Shell />
			</I18nProvider>
		</ThemeProvider>
	);
}
