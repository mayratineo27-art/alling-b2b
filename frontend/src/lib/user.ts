// Deriva "primer nombre + primer apellido" a partir del nombre completo del
// usuario (no hay first_name/last_name separados en el modelo User).
export function getShortName(name?: string | null, fallback = "Mi cuenta"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return fallback;
  return parts.slice(0, 2).join(" ");
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}
