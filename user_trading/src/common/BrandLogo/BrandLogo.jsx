import useTheme from "../../hooks/useTheme";
import darkLogo from "/Images/trade-logo.png";
import lightLogo from "/Images/logo-light.png";

/* The wordmark is artwork, not CSS, so it cannot be re-tinted by a token -
   it needs a second file. Shared as one component rather than duplicated at
   each call site, so a future third placement cannot quietly ship the
   dark-only logo.

   No flash on load: the theme is resolved onto <html> by the boot script in
   index.html before React's first render, so the correct file is chosen on
   the very first paint. */
const BrandLogo = ({ className, alt = "Trade logo" }) => {
  const [theme] = useTheme();

  return (
    <img
      src={theme === "light" ? lightLogo : darkLogo}
      alt={alt}
      className={className}
    />
  );
};

export default BrandLogo;
