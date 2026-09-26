/** Settings panes. Shared by the server routes and the client nav; keep it free of React. */
export const PANES = [
  { id: "account", label: "Account", summary: "Profile, email, sign out" },
  { id: "security", label: "Sign-in & security", summary: "Phone number, sessions" },
  { id: "privacy", label: "Privacy", summary: "Who can reach you, last seen, blocked" },
  { id: "notifications", label: "Notifications", summary: "Chats, groups, previews" },
  { id: "smart-features", label: "Smart features", summary: "Plans, to-dos, memories, catch-up" },
  { id: "appearance", label: "Appearance", summary: "Light, dark or match system" },
  { id: "data", label: "Your data", summary: "Download or delete your account" },
] as const;

export type PaneId = (typeof PANES)[number]["id"];

export const isPane = (id: string): id is PaneId => PANES.some((p) => p.id === id);
