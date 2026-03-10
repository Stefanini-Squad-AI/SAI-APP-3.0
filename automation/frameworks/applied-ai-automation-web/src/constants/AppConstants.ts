/**
 * Global application constants.
 * BASE_URL can be overridden with the BASE_URL environment variable (e.g. in CI for PRs).
 */
const DEFAULT_BASE_URL = "https://stefanini-squad-ai.github.io/SAI-APP-3.0/";

export const AppConstants = {
  BASE_URL: process.env.BASE_URL || DEFAULT_BASE_URL,
} as const;
