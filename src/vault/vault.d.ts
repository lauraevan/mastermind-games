/* Ambient declarations for the learnify catalog.
 * Entry layout mirrors the generated data file: [title, url, icon, source]. */
type VaultEntry = [string, string, string, string];

interface Window {
  __VAULT_DATA?: VaultEntry[];
}
