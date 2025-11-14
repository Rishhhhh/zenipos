/**
 * Application Configuration
 * 
 * Development flags to bypass auth checks and enable menu management
 * without full authentication setup
 */

export const APP_CONFIG = {
  /**
   * Set to true to bypass auth checks in menu management
   * This allows accessing menu features without proper authentication
   */
  DEVELOPMENT_MODE: true,
  
  /**
   * Set to false to allow menu management without branches
   * When false, a default virtual branch will be used
   */
  REQUIRE_BRANCHES: false,
} as const;
