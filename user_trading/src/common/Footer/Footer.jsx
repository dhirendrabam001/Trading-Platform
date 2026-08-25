import "./Footer.css";
import BrandLogo from "../BrandLogo/BrandLogo";

const linkGroups = [
  {
    title: "Platform",
    links: ["Markets", "Spot Trading", "Futures", "Staking"],
  },
  {
    title: "Account",
    links: ["Portfolio", "Transactions", "P&L Reports", "Security"],
  },
  {
    title: "Support",
    links: ["Help Center", "API Docs", "System Status", "Contact Us"],
  },
];

const legalLinks = ["Terms", "Privacy", "Risk Disclosure", "Cookies"];

// Inline SVG rather than lucide's brand icons, which are deprecated upstream
// and come and go between releases
const socials = [
  {
    name: "X",
    path: "M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.4L6.2 22H3l7.3-8.3L2.4 2h6.4l4.4 5.8L18.9 2Zm-1.1 18h1.7L8.3 3.8H6.5L17.8 20Z",
  },
  {
    name: "Telegram",
    path: "M21.9 4.3 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7L18.3 6c.4-.3-.1-.5-.6-.2L7.1 12.4l-4.5-1.4c-1-.3-1-1 .2-1.4l17.6-6.8c.8-.3 1.5.2 1.5 1.5Z",
  },
  {
    name: "Discord",
    path: "M19.3 5.3A16.9 16.9 0 0 0 15.1 4l-.2.4a12.6 12.6 0 0 1 3.7 1.9 17.8 17.8 0 0 0-13.2 0 12.6 12.6 0 0 1 3.7-1.9L8.9 4a16.9 16.9 0 0 0-4.2 1.3C2 9.3 1.3 13.2 1.6 17a17 17 0 0 0 5.2 2.6l1-1.5a11 11 0 0 1-1.8-.8l.4-.3a12.1 12.1 0 0 0 10.3 0l.4.3a11 11 0 0 1-1.8.9l1 1.4a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.3-2.2-11.7ZM8.5 14.8c-1 0-1.9-.9-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Zm7 0c-1 0-1.9-.9-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Z",
  },
  {
    name: "GitHub",
    path: "M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .3.3.7 1 .7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z",
  },
];

const Footer = () => (
  <footer className="ft">
    <div className="ft-top">
      {/* Brand */}
      <div className="ft-brand">
        <BrandLogo alt="Trade logo" className="ft-logo" />
        <p className="ft-tagline">
          Institutional-grade crypto trading built for speed, clarity and
          control.
        </p>

        <div className="ft-socials">
          {socials.map((social) => (
            <a
              key={social.name}
              href="#social"
              className="ft-social"
              aria-label={social.name}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d={social.path} />
              </svg>
            </a>
          ))}
        </div>
      </div>

      {/* Link columns */}
      {linkGroups.map((group) => (
        <nav className="ft-col" key={group.title}>
          <h4 className="ft-col-title">{group.title}</h4>
          <ul>
            {group.links.map((link) => (
              <li key={link}>
                <a href="#link">{link}</a>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>

    <div className="ft-divider" />

    <div className="ft-bottom">
      <span className="ft-copy">
        © {new Date().getFullYear()} TradePro. All rights reserved.
      </span>

      <span className="ft-status">
        <i className="ft-status-dot" aria-hidden="true" />
        All systems operational
      </span>

      <ul className="ft-legal">
        {legalLinks.map((link) => (
          <li key={link}>
            <a href="#legal">{link}</a>
          </li>
        ))}
      </ul>
    </div>

    <p className="ft-disclaimer">
      Trading digital assets carries significant risk and may result in the loss
      of your capital. Past performance is not indicative of future results.
    </p>
  </footer>
);

export default Footer;
