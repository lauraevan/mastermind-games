/* Ambient declarations shared across the Atlas scripts.
 * Entry layout mirrors the generated data file: [title, url, icon, source]. */
type VaultEntry = [string, string, string, string];

interface Window {
  __VAULT_DATA?: VaultEntry[];
  __mmHash?: (s: string) => string;
  __atlasReveal?: () => void;
}
