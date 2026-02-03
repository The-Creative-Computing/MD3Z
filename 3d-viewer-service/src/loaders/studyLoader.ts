import { Study, ModelData, Annotation, ModelType } from '../types';

export const loadStudyFromPath = async (studyPath: string): Promise<Study> => {
  // In a real microservice, this would fetch from an API or use a file system API
  // For now, we'll simulate the structure loading
  
  try {
    const response = await fetch(`${studyPath}/study.json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn("Could not load study.json, trying manual discovery");
  }

  // Fallback: discover files (this is a mock)
  const models: ModelData[] = [];
  const annotations: Annotation[] = [];
  const videos: string[] = [];

  // Simulate loading comments.json
  try {
    const commRes = await fetch(`${studyPath}/comments.json`);
    if (commRes.ok) {
      const data = await commRes.json();
      annotations.push(...data);
    }
  } catch (e) {}

  return {
    id: studyPath.split('/').pop() || 'default-study',
    models,
    annotations,
    videos
  };
};
