import { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  Bell,
  Zap,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import "./Navbar.css";
import { THEME_APP_URL, USER_API_END_POINT } from "../../apis/apis";
import { setUser } from "../../redux/authSlice";
import { useNavigate } from "react-router-dom";
import useTheme from "../../hooks/useTheme";

const Navbar = ({ toggleSidebar }) => {
  const { user } = useSelector((store) => store.auth);
  const [theme, toggleTheme] = useTheme();

  const avatar = `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutHandler = async () => {
    try {
      const res = await axios.post(
        `${USER_API_END_POINT}/logout`,
        {},
        {
          withCredentials: true,
        },
      );

      if (res.data.success) {
        dispatch(setUser(null));
        window.location.href = THEME_APP_URL;
      }
    } catch (error) {
      console.error(error);
    }
  };

  const [openProfile, setOpenProfile] = useState(false);
  const dropdownRef = useRef();

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="navbar-custom d-flex align-items-center justify-content-between">
      {/* LEFT */}
      <div className="nav-left">
        <button
          type="button"
          className="nav-icons"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="search-box d-none d-md-flex">
          <Search size={16} />
          <input type="text" placeholder="Search bots, assets..." />
        </div>
      </div>

      {/* RIGHT */}
      <div className="nav-right">
        <div className="nav-icon nav-icon--optional">
          <Zap size={18} />
        </div>

        <div className="nav-icon position-relative">
          <Bell size={18} />
          <span className="nav-badge">5</span>
        </div>

        <button
          type="button"
          className="nav-icon nav-icon--theme"
          onClick={toggleTheme}
          aria-label={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
          title={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* PROFILE */}
        <div className="profile-wrapper" ref={dropdownRef}>
          <div
            className="profile d-flex align-items-center gap-2"
            onClick={() => setOpenProfile(!openProfile)}
          >
            <div className="avatar-sm">{avatar}</div>
            <ChevronDown size={16} />
          </div>

          {/* DROPDOWN */}
          {openProfile && (
            <div className="profile-dropdown">
              {/* USER INFO */}
              <div className="profile-header">
                <div className="avatar-lg">DB</div>
                <div>
                  <p className="name">Dhirendra Bam</p>
                  <p className="role">Pro Trader</p>
                </div>
              </div>

              <div className="divider"></div>

              {/* MENU */}
              <div
                className="dropdown-item"
                onClick={() => navigate("/profile")}
              >
                <User size={16} /> <span>My Profile</span>
              </div>

              <div className="dropdown-item">
                <Settings size={16} /> <span>Settings</span>
              </div>

              <div className="dropdown-item">
                <HelpCircle size={16} /> <span>Help & Support</span>
              </div>

              <div className="divider"></div>

              <div
                className="dropdown-item logout"
                onClick={logoutHandler}
                style={{ cursor: "pointer" }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
