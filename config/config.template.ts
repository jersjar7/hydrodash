/**
 * Configuration Template for HydroDash
 * Copy this file to config/secrets.local.ts and populate with actual values
 */

export const config = {
  // Public configuration (safe for client-side)
  public: {
    app: {
      name: 'HydroDash',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    api: {
      noaaBaseUrl: 'https://api.water.noaa.gov/nwps/v1',
      nwmBaseUrl: 'https://nwm-api.ciroh.org',
    },
    map: {
      defaultCenter: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      defaultZoom: 10,
      mapbox: {
        publicToken: 'YOUR_MAPBOX_PUBLIC_TOKEN_HERE',
        tilesetId: 'jersondevs.dopm8y3j',       // your tileset
        sourceLayer: 'streams2-7jgd8p',          // vector layer name
        baseStyle: 'mapbox://styles/mapbox/light-v11',
      },
    },
    units: {
      flow: 'cfs' as 'cfs' | 'cms',
      temperature: 'fahrenheit' as 'fahrenheit' | 'celsius',
    },
    appOrigin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Server-only secrets (NEVER expose to client)
  secrets: {
    apple: {
      teamId: 'YOUR_APPLE_TEAM_ID',
      keyId: 'YOUR_MAPKIT_KEY_ID', 
      privateKey: `-----BEGIN PRIVATE KEY-----
YOUR_MAPKIT_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----`,
      mapsId: 'YOUR_MAPS_ID',
      weatherKit: {
        serviceId: 'YOUR_WEATHERKIT_SERVICE_ID',
        keyId: 'YOUR_WEATHERKIT_KEY_ID',
        privateKey: `-----BEGIN PRIVATE KEY-----
YOUR_WEATHERKIT_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----`,
      },
    },
    // Add other service keys as needed
    analytics: {
      apiKey: 'YOUR_ANALYTICS_KEY',
    },
  },
};