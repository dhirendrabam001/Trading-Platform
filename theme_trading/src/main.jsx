import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "./index.css";
import App from "./App.jsx";
import store from "./redux/Store.js";
import { captureSessionFromUrl } from "./auth/session";

// Runs before render so the token is in storage by the first API call
captureSessionFromUrl();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="dark"
        />
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
