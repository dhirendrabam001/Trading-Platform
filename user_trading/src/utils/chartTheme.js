import { useMemo } from "react";
import useTheme from "../hooks/useTheme";

/* Canvas cannot read CSS custom properties - Chart.js needs literal colour
   strings. Rather than keeping a second copy of the palette in JS (which
   would drift from index.css the first time a token changed), this reads the
   resolved token values straight off :root and hands them over.

   Asset-brand colours (bitcoin orange, ethereum blue, ...) deliberately do
   NOT live here. Those identify a coin, not a surface, so they stay fixed in
   both themes. */

const read = () => {
  const styles = getComputedStyle(document.documentElement);
  const token = (name, fallback) => {
    const value = styles.getPropertyValue(name).trim();
    return value || fallback;
  };

  const ink = token("--ink-rgb", "255, 255, 255");

  return {
    /* Axis labels and gridlines */
    tick: token("--text-muted", "#6b7280"),
    grid: `rgba(${ink}, 0.08)`,
    gridFaint: `rgba(${ink}, 0.045)`,

    /* Series */
    accent: token("--primary-vivid", "#00ffb2"),
    accentInk: token("--primary", "#00ffb2"),
    accentRgb: token("--accent-rgb", "0, 255, 178"),
    up: token("--up", "#00ffb2"),
    down: token("--down", "#ff5c7a"),
    track: `rgba(${ink}, 0.07)`,

    /* Tooltip: a solid panel, since a translucent one over a canvas shows
       the plot through it */
    tooltipBg: token("--bg-secondary", "#0a101c"),
    tooltipBorder: token("--border-medium", "rgba(255,255,255,0.12)"),
    tooltipTitle: token("--text-primary", "#ffffff"),
    tooltipBody: token("--text-secondary", "#a1a1aa"),

    surfaceContrast: token("--text-primary", "#ffffff"),
  };
};

/* Recomputed on every theme change, and the new object identity is what
   makes react-chartjs-2 push the updated options into the chart. */
const useChartTheme = () => {
  const [theme] = useTheme();
  // `theme` is carried on the result rather than only gating the memo, so it
  // is a real dependency (and callers that need to branch on it can).
  return useMemo(() => ({ ...read(), theme }), [theme]);
};

export default useChartTheme;
