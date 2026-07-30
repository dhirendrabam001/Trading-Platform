import { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  ADMIN_APP_URL,
  USER_API_END_POINT,
  USER_APP_URL,
} from "../../apis/apis";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/autSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "user",
    rememberMe: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const promise = axios.post(`${USER_API_END_POINT}/login`, formData, {
        withCredentials: true,
      });
      toast.promise(promise, {
        pending: "Login processing...",
        success: "Login Successfully",
        error: {
          render({ data }) {
            return data?.response?.data?.message || "Something is wrong";
          },
        },
      });

      const res = await promise;
      if (res.data.success) {
        // The API nests role inside `user` — `res.data.role` is undefined
        const { token, user } = res.data;

        localStorage.setItem("token", token);
        dispatch(setUser(res.data.user));

        if (user.role === "admin") {
          window.location.href = ADMIN_APP_URL;
        } else {
          window.location.href = USER_APP_URL;
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="lp-root">
      {/* Crypto illustration background (mookup-img.webp) */}
      <div className="lp-bg" aria-hidden="true" />
      {/* Depth / contrast overlay */}
      <div className="lp-overlay" aria-hidden="true" />

      <div className="lp-shell">
        {/* ── Sign-In Card ── */}
        <section className="lp-card">
          {/* Header: hexagon lock + titles */}
          <div className="lp-card-head">
            <span className="lp-hex" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <path
                  d="M24 3.5 40 13v22L24 44.5 8 35V13Z"
                  fill="rgba(18,224,163,0.07)"
                  stroke="url(#lpHex)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <rect
                  x="17.5"
                  y="23"
                  width="13"
                  height="11"
                  rx="2.6"
                  stroke="#12e0a3"
                  strokeWidth="2"
                />
                <path
                  d="M20.5 23v-2.6a3.5 3.5 0 0 1 7 0V23"
                  stroke="#12e0a3"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="24" cy="27.6" r="1.5" fill="#12e0a3" />
                <path
                  d="M24 29v2.4"
                  stroke="#12e0a3"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="lpHex"
                    x1="8"
                    y1="4"
                    x2="40"
                    y2="45"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#12e0a3" />
                    <stop offset="1" stopColor="#17a8e0" />
                  </linearGradient>
                </defs>
              </svg>
            </span>

            <div className="lp-head-text">
              <span className="lp-welcome">Welcome Back</span>
              <h1 className="lp-title">Sign In</h1>
              <p className="lp-subtitle">
                Access your account and continue trading
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="lp-form" noValidate>
            {/* Email */}
            <div className="lp-field">
              <label htmlFor="email">Email Address</label>
              <div className="lp-input-wrap">
                <svg
                  className="lp-input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="lp-field">
              <label htmlFor="password">Password</label>
              <div className="lp-input-wrap">
                <svg
                  className="lp-input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M1 1l22 22"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Account Type */}
            <div className="lp-field">
              <label htmlFor="role">Account Type</label>
              <div className="lp-input-wrap lp-select-wrap">
                <svg
                  className="lp-input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3l7 3v5.1c0 4.3-2.9 7.9-7 9.9-4.1-2-7-5.6-7-9.9V6l7-3z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.2 11.8l1.9 1.9 3.7-3.8"
                  />
                </svg>
                <select
                  id="role"
                  name="role"
                  className="lp-select"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="lp-row">
              <label className="lp-check">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span className="lp-check-box" />
                <span>Remember me</span>
              </label>
              <a href="#forgot" className="lp-forgot">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button type="submit" className="lp-submit">
              Sign In
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </form>

          {/* Divider */}
          <div className="lp-divider">
            <span>or continue with</span>
          </div>

          {/* Social */}
          <div className="lp-socials">
            <button type="button" className="lp-social">
              <svg viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google
            </button>

            <button
              onClick={() => navigate("/register")}
              type="button"
              className="lp-social"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 14c2.7 0 5 2.3 5 5v1H4v-1c0-2.7 2.3-5 5-5h6zm-3-2a4 4 0 100-8 4 4 0 000 8zm7 0h-2V9h-3V7h3V4h2v3h3v2h-3v3z" />
              </svg>
              Create an Account
            </button>
          </div>

          {/* Security banner */}
          <div className="lp-secure">
            <div className="lp-secure-left">
              <span className="lp-secure-ico">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 2l7 3v6c0 4.5-3.05 8.2-7 9.5C8.05 19.2 5 15.5 5 11V5l7-3z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 11.5l2 2 4-4.5"
                  />
                </svg>
              </span>
              <div className="lp-secure-txt">
                <span className="lp-secure-title">Your data is protected</span>
                <span className="lp-secure-sub">256-bit SSL encryption</span>
              </div>
            </div>

            <span className="lp-secure-badge" aria-hidden="true">
              <svg viewBox="0 0 72 56" fill="none">
                <ellipse cx="40" cy="50" rx="24" ry="4" fill="url(#lpBase)" />
                <path
                  d="M40 8l14 5v11c0 10.5-6.6 15.8-14 19-7.4-3.2-14-8.5-14-19V13l14-5z"
                  fill="url(#lpShield)"
                  stroke="#12e0a3"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M33 27l5 5 9-10"
                  stroke="#eafff8"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient
                    id="lpShield"
                    x1="26"
                    y1="8"
                    x2="54"
                    y2="43"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#12e0a3" stopOpacity="0.85" />
                    <stop offset="1" stopColor="#7b3ff2" stopOpacity="0.85" />
                  </linearGradient>
                  <radialGradient
                    id="lpBase"
                    cx="0"
                    cy="0"
                    r="1"
                    gradientTransform="translate(40 50) scale(24 4)"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#12e0a3" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#12e0a3" stopOpacity="0" />
                  </radialGradient>
                </defs>
              </svg>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
