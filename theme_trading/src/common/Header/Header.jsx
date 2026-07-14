import React from "react";
import "./Header.css";
import TradeLogo from "/Images/trade-logo.png";

const Header = () => {
  return (
    <nav className="navbar navbar-expand-lg custom-navbar px-3 px-lg-5">
      {/* ✅ LOGO */}
      <a className="navbar-brand d-flex align-items-center" href="/">
        <img
          src={TradeLogo} // 👉 replace with your logo path
          alt="logo"
          className="logo-img"
        />
      </a>

      {/* ✅ MOBILE TOGGLE */}
      <button
        className="navbar-toggler border-0"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarContent"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      {/* ✅ NAV ITEMS */}
      <div className="collapse navbar-collapse" id="navbarContent">
        <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-lg-4 text-center">
          <li className="nav-item">
            <a className="nav-link" href="#">
              Home
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Features
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Markets
            </a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">
              Pricing
            </a>
          </li>
        </ul>

        {/* ✅ RIGHT BUTTON */}
        <div className="d-flex justify-content-center">
          <button className="btn btn-get-started">Get Started →</button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
