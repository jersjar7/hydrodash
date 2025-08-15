/**
 * Main Configuration Module for HydroDash
 * Merges public config with secrets on server-side
 * Exports only public config for client-side usage
 */

// Server-side: Import actual secrets
// Client-side: This import will fail, which is handled below
import { config as localConfig } from './secrets.local'; 
let configWithSecrets: any = null;

if (typeof window === 'undefined') {
  // Server-side only: Load the secrets file
  try {
    configWithSecrets = require('./secrets.local').config;
  } catch (error) {
    // In production, you might load from environment variables instead
    console.warn('Warning: secrets.local.ts not found. Using template config.');
    configWithSecrets = require('./config.template').config;
  }
} else {
  // Client-side: Only load the template for type structure
  // Actual values will come from server via API or props
  configWithSecrets = require('./config.template').config;
}

// Type definitions for configuration
export interface PublicConfig {
  app: {
    name: string;
    version: string;
    environment: string;
  };
  api: {
    noaaBaseUrl: string;
    nwmBaseUrl: string;
  };
  map: {
    defaultCenter: { lat: number; lng: number };
    defaultZoom: number;
  };
  units: {
    flow: 'cfs' | 'cms';
    temperature: 'fahrenheit' | 'celsius';
  };
  appOrigin: string;
}

export interface SecretsConfig {
  apple: {
    teamId: string;
    keyId: string;
    privateKey: string;
    mapsId: string;
    weatherKit: {
      serviceId: string;
      keyId: string;
      privateKey: string;
    };
  };
  analytics: {
    apiKey: string;
  };
}

export interface AppConfig {
  public: PublicConfig;
  secrets: SecretsConfig;
}

// Export public config for client-side usage
export const publicConfig: PublicConfig = configWithSecrets.public;

export const appConfig = localConfig;

// Export full config for server-side usage (includes secrets)
export const getServerConfig = (): AppConfig => {
  if (typeof window !== 'undefined') {
    throw new Error('getServerConfig() can only be called on the server side');
  }
  return configWithSecrets as AppConfig;
};

// Helper function to check if we're in development
export const isDevelopment = () => publicConfig.app.environment === 'development';

// Helper function to check if we're in production
export const isProduction = () => publicConfig.app.environment === 'production';