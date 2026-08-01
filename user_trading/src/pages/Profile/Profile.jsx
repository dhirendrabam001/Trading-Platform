import React, { useState } from "react";
import {
  FiUser,
  FiShield,
  FiBell,
  FiKey,
  FiClock,
  FiDownload,
  FiTrash2,
  FiCheckCircle,
  FiEdit2,
  FiUpload,
  FiEye,
  FiEyeOff,
  FiSmartphone,
  FiMonitor,
  FiChevronRight,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiRefreshCw,
  FiLock,
  FiTarget,
  FiUploadCloud,
} from "react-icons/fi";
import "./Profile.css";
import { useSelector } from "react-redux";

const Profile = () => {
  const { user } = useSelector((store) => store.auth);
  const avatar = `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`;
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`;
  const joinDate = new Date(user?.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const lastLogin = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Never";
  const lastLoginTime = user?.lastLogin
    ? new Date(user.lastLogin).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "--";

  console.log(joinDate);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    bio: "Passionate about algorithmic trading and AI technology. Building the future of automated trading.",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="profile-container">
      {/* Top Header */}
      <div className="profile-top-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">
            Manage your personal information and account preferences
          </p>
        </div>
        <button className="btn-export">
          <FiUploadCloud size={15} /> Export Profile
        </button>
      </div>

      {/* Main Grid: Sidebar + Profile Content */}
      <div className="profile-layout-grid">
        {/* Left Sub-Navigation */}
        <div className="card profile-sidebar-nav">
          <button
            className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FiUser size={16} /> <span>Overview</span>
          </button>
          <button
            className={`nav-link ${activeTab === "personal" ? "active" : ""}`}
            onClick={() => setActiveTab("personal")}
          >
            <FiUser size={16} /> <span>Personal Information</span>
          </button>
          <button
            className={`nav-link ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <FiShield size={16} /> <span>Security Settings</span>
          </button>
          <button
            className={`nav-link ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <FiBell size={16} /> <span>Notification Preferences</span>
          </button>
          <button
            className={`nav-link ${activeTab === "api" ? "active" : ""}`}
            onClick={() => setActiveTab("api")}
          >
            <FiKey size={16} /> <span>API Settings</span>
          </button>
          <button
            className={`nav-link ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => setActiveTab("sessions")}
          >
            <FiClock size={16} /> <span>Activity Sessions</span>
          </button>
          <button className="nav-link">
            <FiDownload size={16} /> <span>Download Data</span>
          </button>
          <button className="nav-link text-danger-link">
            <FiTrash2 size={16} /> <span>Delete Account</span>
          </button>
        </div>

        {/* Right Main Content */}
        <div className="profile-main-views">
          {/* Top User Summary Card */}
          <div className="card user-summary-card">
            <div className="user-profile-left">
              <div className="avatar-holder">
                <div className="profile-avatar-circle">{avatar}</div>
                <button className="btn-avatar-edit">
                  <FiEdit2 size={11} />
                </button>
              </div>

              <div className="user-details-body">
                <div className="name-row">
                  <h2>{fullName}</h2>
                  <FiCheckCircle className="verified-icon" />
                </div>
                <span className="user-role-title">{`Super ${user?.role}`}</span>

                <div className="contact-meta-list">
                  <div className="meta-item">
                    <FiMail size={13} className="meta-icon" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="meta-item">
                    <FiPhone size={13} className="meta-icon" />
                    <span>{user?.phoneNumber}</span>
                  </div>

                  <div className="meta-item">
                    <FiCalendar size={13} className="meta-icon" />
                    <span>{`Member since ${joinDate}`}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info Status Bar */}
            <div className="account-status-right">
              <div className="status-item">
                <span className="label-text">Account Status</span>
                <span className="pill-badge pill-active">
                  {user?.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="status-item">
                <span className="label-text">Account Type</span>
                <span className="val-text font-bold">{`Super ${user?.role}`}</span>
              </div>
              <div className="status-item">
                <span className="label-text">Two-Factor Auth</span>
                <span className="text-primary font-bold">Enabled</span>
              </div>
              <div className="status-item">
                <span className="label-text">Email Verified</span>
                <span className="text-primary font-bold flex-inline">
                  {user?.isVerified ? "Verified" : "Not Verified"}
                  <FiCheckCircle size={13} style={{ marginLeft: "4px" }} />
                </span>
              </div>
              <div className="status-item">
                <span className="label-text">KYC Status</span>
                <span className="text-primary font-bold flex-inline">
                  {user?.kycStatus ? "Completed" : "Pending"}
                  <FiCheckCircle size={13} style={{ marginLeft: "4px" }} />
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="metrics-row">
            <div className="card metric-box">
              <div className="metric-icon-bg">
                <FiRefreshCw size={16} />
              </div>
              <div>
                <span className="metric-label">Total Logins</span>
                <h3 className="metric-val">{user?.loginCount}</h3>
                <span className="metric-sub text-primary">
                  +12.4% vs last month
                </span>
              </div>
            </div>

            <div className="card metric-box">
              <div className="metric-icon-bg">
                <FiCalendar size={16} />
              </div>
              <div>
                <span className="metric-label">Last Login</span>
                <h3 className="metric-val">{lastLogin}</h3>
                <span className="metric-sub text-muted">{lastLoginTime}</span>
              </div>
            </div>

            <div className="card metric-box">
              <div className="metric-icon-bg">
                <FiLock size={16} />
              </div>
              <div>
                <span className="metric-label">Account Security</span>
                <h3 className="metric-val">Strong</h3>
                <span className="metric-sub text-muted">All good</span>
              </div>
            </div>

            <div className="card metric-box">
              <div className="metric-icon-bg">
                <FiTarget size={16} />
              </div>
              <div>
                <span className="metric-label">Profile Completion</span>
                <h3 className="metric-val">100%</h3>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Form: Personal Information */}
          <div className="card profile-section">
            <div className="section-head">
              <h3 className="section-title">Personal Information</h3>
              <button className="btn-primary">Save Changes</button>
            </div>

            <div className="personal-info-body">
              <div className="form-inputs-left">
                <div className="field-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="field-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="field-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="field-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="field-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    rows="3"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="form-control textarea"
                  ></textarea>
                </div>
              </div>

              {/* Profile Avatar Box */}
              <div className="avatar-upload-area">
                <span className="upload-title">Profile Picture</span>
                <div className="big-avatar-wrapper">
                  <div className="big-avatar-circle">DB</div>
                  <button className="btn-big-avatar-edit">
                    <FiEdit2 size={13} />
                  </button>
                </div>
                <p className="upload-note">JPG, PNG or GIF. Max size of 2MB.</p>
                <button className="btn-upload-new">
                  <FiUpload size={14} style={{ marginRight: "6px" }} /> Upload
                  New Picture
                </button>
              </div>
            </div>
          </div>

          {/* Form: Security Settings */}
          <div className="card profile-section">
            <div className="section-head">
              <h3 className="section-title">Security Settings</h3>
              <button className="btn-yellow">Change Password</button>
            </div>

            <div className="security-settings-grid">
              <div className="password-col">
                <div className="field-group">
                  <label>Current Password</label>
                  <div className="password-wrapper">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      defaultValue="123456789012"
                      className="form-control"
                    />
                    <button
                      type="button"
                      className="pwd-toggle"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <FiEyeOff size={14} />
                      ) : (
                        <FiEye size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="input-row-2col">
                  <div className="field-group">
                    <label>New Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        defaultValue="123456789012"
                        className="form-control"
                      />
                      <button
                        type="button"
                        className="pwd-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <FiEyeOff size={14} />
                        ) : (
                          <FiEye size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Confirm New Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        defaultValue="123456789012"
                        className="form-control"
                      />
                      <button
                        type="button"
                        className="pwd-toggle"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff size={14} />
                        ) : (
                          <FiEye size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2FA Card Box */}
              <div className="card-2fa">
                <div className="info-2fa">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                  <div className="status-2fa">
                    <span>Status</span>
                    <strong className="text-primary">Enabled</strong>
                  </div>
                  <button className="btn-manage-2fa">Manage 2FA</button>
                </div>
                <div className="shield-icon-green">
                  <FiShield size={38} />
                </div>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="card profile-section">
            <div className="section-head">
              <h3 className="section-title">Active Sessions</h3>
            </div>

            <div className="table-responsive">
              <table className="sessions-table">
                <thead>
                  <tr>
                    <th>DEVICE</th>
                    <th>LOCATION</th>
                    <th>IP ADDRESS</th>
                    <th>LAST ACTIVE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span className="flex-inline">
                        <FiMonitor className="device-icon" /> Chrome on Windows
                      </span>
                    </td>
                    <td>Kathmandu, Nepal</td>
                    <td>192.168.1.100</td>
                    <td>Jul 19, 2025 10:24 AM</td>
                    <td>
                      <span className="status-badge pill-active">Current</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="flex-inline">
                        <FiSmartphone className="device-icon" /> Mobile Safari
                        on iPhone
                      </span>
                    </td>
                    <td>Kathmandu, Nepal</td>
                    <td>192.168.1.101</td>
                    <td>Jul 18, 2025 08:15 PM</td>
                    <td>
                      <span className="text-primary font-bold">Active</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="flex-inline">
                        <FiMonitor className="device-icon" /> Chrome on MacOS
                      </span>
                    </td>
                    <td>Lalitpur, Nepal</td>
                    <td>192.168.1.102</td>
                    <td>Jul 17, 2025 04:30 PM</td>
                    <td>
                      <span className="text-primary font-bold">Active</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="table-view-more">
              <button className="link-btn">View All Sessions</button>
            </div>
          </div>

          {/* Bottom Grid: Preferences & Danger Zone */}
          <div className="bottom-cards-row">
            {/* Account Preferences */}
            <div className="card profile-section preference-box">
              <div className="section-head">
                <h3 className="section-title">Account Preferences</h3>
              </div>
              <div className="pref-list">
                <div className="pref-item">
                  <span>Theme</span>
                  <span className="pref-val">
                    Dark <FiChevronRight size={14} />
                  </span>
                </div>
                <div className="pref-item">
                  <span>Dashboard Layout</span>
                  <span className="pref-val">
                    Default <FiChevronRight size={14} />
                  </span>
                </div>
                <div className="pref-item">
                  <span>Auto Logout</span>
                  <span className="pref-val">
                    30 minutes <FiChevronRight size={14} />
                  </span>
                </div>
                <div className="pref-item">
                  <span>Email Notifications</span>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card profile-section danger-box">
              <div className="section-head">
                <h3 className="section-title text-danger">Danger Zone</h3>
              </div>
              <div className="danger-zone-content">
                <div className="danger-text">
                  <h4 className="text-danger">Delete Account</h4>
                  <p>
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <button className="btn-delete">Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
