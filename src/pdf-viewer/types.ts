export interface PdfProps {
  src: string;
  height?: number;
  clipRegion?: { x: number; y: number; width: number; height: number };
}