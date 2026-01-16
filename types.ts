
export type AspectRatio = {
  label: string;
  value: number; // width / height
  category: 'Standard' | 'Cinema' | 'Print' | 'Advanced';
};

export type ShapeType = 
  | 'square' | 'circle' | 'ellipse' 
  | 'rounded' | 'pill' | 'squircle'
  | 'triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'octagon' | 'polygon'
  | 'star' | 'heart' | 'bubble' | 'shield' | 'badge' | 'teardrop' | 'location' | 'cloud'
  | 'blob' | 'wave' | 'liquid' | 'svg_path' | 'ai_cutout';

export interface ShapeConfig {
  sides: number;        // For polygons (n-gon)
  points: number;       // For stars
  innerRadius: number;  // For stars
  seed: number;         // For organic blobs
  svgPath?: string;     // For custom SVG paths
  complexity: number;   // For organic shapes
}

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  originalWidth: number;
  originalHeight: number;
  processedUrl?: string;
}

export interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  aspectRatio: number;
  shape: ShapeType;
  cornerRadius: number;
  shapeConfig: ShapeConfig;
}

export interface WatermarkState {
  enabled: boolean;
  type: 'text' | 'image';
  text?: string;
  imageUrl?: string;
  opacity: number;
  scale: number;
  position: 'center' | 'bottom-right' | 'top-left' | 'tile';
}

export interface ExportConfig {
  format: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
  quality: number;
  keepMetadata: boolean;
}
