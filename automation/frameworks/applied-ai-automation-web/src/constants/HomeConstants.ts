import { AppConstants } from "./AppConstants";

/**
 * Shared constants for the Home page of TuCreditoOnline.
 * Only contains values shared across multiple tests.
 */
export const HomeConstants = {
  BASE_URL: AppConstants.BASE_URL,

  // Section titles verified after switching the app language to English
  SECTION_TITLES_EN: ["about us", "our services", "visit us"],
} as const;
