import { ReactNode } from "react";

export declare namespace ID3Map {
  export interface Feature<P> {
    type: 'Feature';
    properties: P;
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: [number, number][][];
    }
  }

  export interface GeoJson<P> {
    type: 'FeatureCollection';
    name: string;
    features: Feature<P>[];
  }

  export interface OutputParams<P> {
    properties: P;
  }

  export interface HookProps<P, J> {
    initComponentProps: ComponentProps<P, J>;
  }

  export interface ColorSetItem<P> {
    targetPropertiesKey: keyof P;
    targetPropertiesValue: string;
    color: string;
  }

  export interface ColorSet<P> {
    items: ColorSetItem<P>[];
  }

  export interface Code {
    BJCD?: string; 
    HJCD?: string;

    TOT_REG_CD?: string;
    ADM_CD?: string; 
  }

  export type MouseEventCallback<P> = (event: any, params: OutputParams<P>) => void;
  export type FeaturesChangeCallback<P> = (features: Feature<P>[] | undefined, outputParamsArray: OutputParams<P>[] | undefined) => void;

  export interface ApiItem<J> {
    jsonType: J;
    url: string;
  }

  // export type ApiData<T> = Map<T, T extends 'kikmix-json' ? ID3Map.KikMixItem[] : ID3Map.GeoJson>;

  export interface ComponentProps<P, J> {
    apis: ApiItem<J>[];
    height: number;

    currentMap: J;

    // country: Country;
    // range: Range;
    // city: City;
    
    isZoomEnable?: boolean;
    isAlwaysFitSizeMap?: boolean;
    polygonDefaultColor?: string;
    polygonStrokeWidth?: number;
    polygonStrokeColor?: string;
    polygonColorChangeDuration?: number;

    onPolygonMouseOver?: MouseEventCallback<P>;
    onPolygonMouseOut?: MouseEventCallback<P>;
    onPolygonMouseMove?: MouseEventCallback<P>;
    onFeaturesChange?: FeaturesChangeCallback<P>;

    colorSet?: ColorSet<P>;

    tooltipContentComponent?: ReactNode;
  }
}