import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { captureSessionFromUrl } from "./auth/session";
import { Provider } from "react-redux";
import store from "./redux/store.js";
// Runs before render so the token is out of the URL and in storage
// before the first paint or API call.
captureSessionFromUrl();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
