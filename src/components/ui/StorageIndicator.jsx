// Data now lives in Supabase instead of IndexedDB, so there's no local
// browser storage quota to show here anymore. Kept as a no-op component
// so existing call sites (ManageModal, PracticePanel) don't need changes.
export function StorageIndicator() {
  return null;
}
