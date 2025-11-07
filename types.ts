export interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageItem {
  id: string;
  name: string;
  dataUrl: string;
  placement?: Placement;
}

export interface ShadingOptions {
  enabled: boolean;
  angle: number;
  distance: number;
  blur: number;
  opacity: number;
}

export interface LightingColor {
  id: string;
  color: string;
}

export interface LightingOptions {
  enabled: boolean;
  intensity: number;
  backgroundDarkness: number;
  colors: LightingColor[];
  activeColorId: string | null;
}

export type WorkspaceView = 'welcome' | 'preview' | 'results';

export interface ResultItem {
    id: string;
    productId: string;
    productName: string;
    backgroundName: string;
    lightColor?: string;
    dataUrl: string;
}

export interface TemplateData {
    name: string;
    backgrounds: {
        id: string;
        name: string;
        placement: Placement;
        fileName: string;
    }[];
    shadingOptions: ShadingOptions;
    lightingOptions: LightingOptions;
}