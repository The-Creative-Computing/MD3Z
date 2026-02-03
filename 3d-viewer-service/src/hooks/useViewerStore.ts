import { useState, useCallback } from 'react';
import type { ModelData, Annotation, LayoutType, Study } from '../types';

export const useViewerStore = () => {
  const [layout, setLayout] = useState<LayoutType>('1');
  const [models, setModels] = useState<ModelData[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeViewportIndex, setActiveViewportIndex] = useState<number | null>(null);
  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null);

  const addModel = useCallback((model: ModelData) => {
    setModels((prev) => [...prev, model]);
  }, []);

  const removeModel = useCallback((id: string) => {
    setModels((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateModelOpacity = useCallback((id: string, opacity: number) => {
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, opacity } : m))
    );
  }, []);

  const updateModelVisibility = useCallback((id: string, visible: boolean) => {
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, visible } : m))
    );
  }, []);

  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    layout,
    setLayout,
    models,
    setModels,
    annotations,
    setAnnotations,
    activeViewportIndex,
    setActiveViewportIndex,
    focusTarget,
    setFocusTarget,
    addModel,
    removeModel,
    updateModelOpacity,
    updateModelVisibility,
    addAnnotation,
    removeAnnotation,
  };
};
