// types/mapkit.d.ts
declare global {
  const mapkit: {
    init(options: {
      authorizationCallback: (done: (token: string) => void) => void;
      language?: string;
    }): void;

    Map: new (
      element: HTMLElement,
      options?: {
        center?: mapkit.Coordinate;
        showsZoomControl?: boolean;
        showsMapTypeControl?: boolean;
        colorScheme?: 'light' | 'dark';
      }
    ) => mapkit.Map;

    Coordinate: new (latitude: number, longitude: number) => mapkit.Coordinate;
    
    CoordinateRegion: new (
      center: mapkit.Coordinate,
      span: mapkit.CoordinateSpan
    ) => mapkit.CoordinateRegion;
    
    CoordinateSpan: new (
      latitudeDelta: number,
      longitudeDelta: number
    ) => mapkit.CoordinateSpan;

    GeoJSONOverlay: new (
      data: any,
      options?: { style?: mapkit.Style }
    ) => mapkit.Overlay;
  };

  namespace mapkit {
    interface Map {
      region: CoordinateRegion;
      addOverlay(overlay: Overlay): void;
      removeOverlay(overlay: Overlay): void;
      destroy(): void;
    }

    interface Coordinate {
      latitude: number;
      longitude: number;
    }

    interface CoordinateRegion {
      center: Coordinate;
      span: CoordinateSpan;
    }

    interface CoordinateSpan {
      latitudeDelta: number;
      longitudeDelta: number;
    }

    interface Overlay {}

    interface Style {
      lineWidth?: number;
      strokeColor?: string;
    }
  }
}

export {};x