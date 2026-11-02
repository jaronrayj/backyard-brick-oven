import React from "react";
import ReactDOM from "react-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./pages/App";
import reportWebVitals from "./reportWebVitals";

const rootElement = document.getElementById("message");

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// react-snap prerenders static HTML for a few public pages at build time and
// stamps each with its path. Hydrate only that page's own markup: every other
// route (the team pages) is served the home page's HTML, and hydrating that
// would keep the home page's wrapper classes, so those render fresh instead.
const pathOf = (p) => (p || "").replace(/\/$/, "") || "/";
if (navigator.userAgent === "ReactSnap") {
  rootElement.setAttribute("data-path", pathOf(window.location.pathname));
}
const prerendered =
  rootElement.hasChildNodes() &&
  rootElement.getAttribute("data-path") === pathOf(window.location.pathname);
if (prerendered) {
  ReactDOM.hydrate(app, rootElement);
} else {
  rootElement.replaceChildren();
  ReactDOM.render(app, rootElement);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
