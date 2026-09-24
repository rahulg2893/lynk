/** Shared by the server layout and the client toggle; keep it free of React. */
export const THEME_KEY = "lynk-theme";

/**
 * Runs in <head> before first paint so a saved Light or Dark choice never
 * flashes the other theme. "system" leaves no attribute, and the CSS follows
 * prefers-color-scheme.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}})();`;

