import { useState } from "react";
import "./Login.css";

const PARTICLE_COUNT = 14;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // hook up your auth call here
  };

  return (
    <section className="login-main">
      {/* ambient animated background */}
      <div className="login-bg-grid" aria-hidden="true" />
      <div className="login-glow login-glow-1" aria-hidden="true" />
      <div className="login-glow login-glow-2" aria-hidden="true" />
      <div className="login-particles" aria-hidden="true">
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <span
            key={i}
            className="login-particle"
            style={{
              left: `${(i * 137) % 100}%`,
              animationDelay: `${(i * 0.7) % 9}s`,
              animationDuration: `${8 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="row w-100 justify-content-center">
          <div className="col-11 col-sm-8 col-md-6 col-lg-4">
            <div className="login-card card">
              <div className="brand-mark">
                <span className="brand-dot" />
                <span className="brand-name">Dashboard</span>
              </div>

              <div className="login-card-header">
                <h2 className="login-title">Welcome back</h2>
                <p className="login-caption">
                  Sign in to access your dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label login-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control login-input"
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="mb-2">
                  <label htmlFor="password" className="form-label login-label">
                    Password
                  </label>
                  <div className="password-field">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="form-control login-input"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="login-row-between mb-4">
                  <label className="remember-check">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <a href="#forgot" className="login-link">
                    Forgot password?
                  </a>
                </div>

                <button type="submit" className="btn-primary w-100">
                  Sign in
                </button>
              </form>

              <div className="login-divider">
                <span>New to the platform?</span>
              </div>

              <a href="#signup" className="btn-secondary w-100 text-center">
                Create an account
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
