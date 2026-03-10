import { AppConstants } from "./AppConstants";

/**
 * Shared constants for the Services page of TuCreditoOnline.
 * Only contains values shared across multiple tests.
 */
export const ServicesConstants = {
  BASE_URL: AppConstants.BASE_URL,

  // Expected path after clicking the Services menu item
  SERVICES_PATH: "/services",
} as const;
