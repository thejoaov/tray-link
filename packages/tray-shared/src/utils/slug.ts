/**
 * Generates a consistent, URL-safe slug from a tool name.
 *
 * Examples:
 *   "Visual Studio Code"  → "visual-studio-code"
 *   "iTerm"               → "iterm"
 *   "GNOME Terminal"      → "gnome-terminal"
 *   "Xcode"               → "xcode"
 *   "PyCharm CE"          → "pycharm-ce"
 *   "VS Code Insiders"    → "vs-code-insiders"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace any non-alphanumeric run with a hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}
