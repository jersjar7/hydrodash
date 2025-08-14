// types/models/WeatherForecast.ts
export interface WeatherPoint {
  time: string;           // ISO
  temperatureC?: number;
  precipitationMm?: number;
  uvIndex?: number;
  aqi?: number;           // US EPA AQI scale
  windKph?: number;
  windDirectionDeg?: number;
}

export interface WeatherForecast {
  location: { lat: number; lon: number };
  hourly: WeatherPoint[];
  issuedAt: string;       // ISO
  provider: 'weatherkit';
}
