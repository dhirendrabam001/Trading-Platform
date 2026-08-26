import "./Footer.css";

const COLUMNS = [
  {
    title: "Markets",
    links: [
      { label: "Crypto", href: "#markets" },
      { label: "Stocks", href: "#markets" },
      { label: "Forex", href: "#markets" },
      { label: "Commodities", href: "#markets" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Features", href: "#features" },
      { label: "Terminal", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Security", href: "#security" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help centre", href: "#faq" },
      { label: "FAQ", href: "#faq" },
      { label: "Getting started", href: "#how-it-works" },
      { label: "System status", href: "#" },
    ],
  },
];

const Footer = () => (
  <footer className="site-footer">
    <div className="container">
      <div className="footer-top">
        <div className="footer-brand">
          <a className="footer-logo" href="/">
            <img src="/Images/trade-logo.png" alt="Nexa" />
          </a>
          <p className="footer-tagline">
            One account for crypto, equities and FX — with sub-second execution
            and a wallet that settles the moment your trade fills.
          </p>
        </div>

        <nav className="footer-cols" aria-label="Footer">
          {COLUMNS.map((col) => (
            <div className="footer-col" key={col.title}>
              <h3 className="footer-col-title">{col.title}</h3>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href}>{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <p className="footer-risk">
        Trading leveraged and digital assets carries a high level of risk and
        can result in the loss of all your capital. These products may not be
        suitable for every investor — make sure you fully understand the risks
        involved and seek independent advice if necessary.
      </p>

      <div className="footer-bottom">
        {/* Derived so the year cannot silently go stale in the footer */}
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} Nexa Trading. All rights reserved.
        </p>
        <ul className="footer-legal">
          <li>
            <a href="#">Terms</a>
          </li>
          <li>
            <a href="#">Privacy</a>
          </li>
          <li>
            <a href="#">Risk disclosure</a>
          </li>
          <li>
            <a href="#">Cookies</a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
);

export default Footer;
