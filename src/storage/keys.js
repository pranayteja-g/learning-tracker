// Core app data (roadmaps, progress, notes, resources, topic meta) now lives
// entirely in Supabase — see src/lib/cloudField.js. This file used to also
// hold the localStorage keys for that data pre-migration; they were unused
// dead exports and have been removed.
export const ONBOARDING_COMPLETED_KEY = "learning-tracker-onboarding-completed-v1";
