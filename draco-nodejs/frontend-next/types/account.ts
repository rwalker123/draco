/**
 * Account-related type definitions for the Draco Sports Manager application.
 *
 * This file contains the comprehensive Account interface and related types
 * used across the frontend application for account management and display.
 */

/**
 * Comprehensive Account interface containing all account properties
 * used throughout the application.
 */
export interface Account {
  id: string;
  name: string;
  accountType: string;
  accountTypeId: string;
  firstYear: number;
  affiliation?: { name: string; url: string } | null;
  timezoneId: string;
  twitterAccountName?: string;
  facebookFanPage?: string;
  urls: Array<{ id: string; url: string }>;
  accountLogoUrl?: string;
}

/**
 * Minimal Account interface for contexts that only need basic account information.
 * Used in AccountContext and other lightweight use cases.
 */
export interface MinimalAccount {
  id: string;
  name: string;
  accountType?: string;
}

/**
 * Social media Account interface for components that only need social media URLs.
 * Used in join-league components and other social media display contexts.
 */
export interface SocialAccount {
  id: string;
  name: string;
  urls: Array<{ id: string; url: string }>;
  twitterAccountName?: string;
  facebookFanPage?: string;
}
