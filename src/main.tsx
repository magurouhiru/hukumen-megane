import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
// biome-ignore lint/suspicious/noTsIgnore: vita でビルド時に作成されるので無視する
// @ts-ignore
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import NotFound from "./component/404";
// biome-ignore lint/suspicious/noTsIgnore: vita でビルド時に作成されるので無視する
// @ts-ignore
import { messages } from "./locales/ja/messages";

i18n.load("ja", messages);
i18n.activate("ja");

// Set up a Router instance
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

// Register things for typesafety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");

if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <I18nProvider i18n={i18n}>
      <RouterProvider router={router} defaultNotFoundComponent={NotFound} />
    </I18nProvider>,
  );
} else {
  console.error("Root element not found or already has content");
}
