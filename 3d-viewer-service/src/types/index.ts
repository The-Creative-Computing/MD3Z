export type ModelType = 'stl' | 'ply' | 'splat';

export interface Annotation {
  id: string;
  modelId: string; // ID of the model this annotation belongs to
  modelName: string;
  position: [number, number, number];
  text: string;
  createdAt: number;
  author?: string;
}

export interface ModelData {
  id: string;
  url: string;
  type: ModelType;
  name: string;
  opacity: number;
  visible: boolean;
}

export interface Study {
  id: string;
  name?: string;
  models: ModelData[];
  annotations: Annotation[];
  videos: any[]; 
}

export type LayoutType = '1' | '1x2' | '2x2';
