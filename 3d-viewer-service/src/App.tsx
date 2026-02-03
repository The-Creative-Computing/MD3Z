import React, { useState, useRef, useEffect } from 'react';
import { Viewport } from './components/Viewport';
import { useViewerStore } from './hooks/useViewerStore';
import type { LayoutType, ModelData, Annotation } from './types';
import {
  Grid2X2,
  Columns,
  Square,
  Video,
  Plus,
  Trash2,
  Download,
  FolderOpen,
  ChevronLeft,
  Loader2,
  Box,
  Eye,
  EyeOff,
  MessageSquare,
  Clock,
  User,
  X,
  Layers
} from 'lucide-react';

interface StudyListItem {
  id: string;
  name: string;
  modelCount: number;
}

const App: React.FC = () => {
  const {
    layout,
    setLayout,
    models,
    setModels,
    annotations,
    setAnnotations,
    addAnnotation,
    removeAnnotation,
    updateModelOpacity,
    updateModelVisibility,
    addModel,
    removeModel,
    activeViewportIndex,
    setActiveViewportIndex,
    focusTarget,
    setFocusTarget
  } = useViewerStore();

  const [viewportModels, setViewportModels] = useState<Record<number, ModelData[]>>({});
  const [view, setView] = useState<'portal' | 'list' | 'viewer'>('portal');
  const [studies, setStudies] = useState<StudyListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStudyName, setCurrentStudyName] = useState('');
  const [currentStudyId, setCurrentStudyId] = useState('');
  const [showComments, setShowComments] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const API_URL = 'http://localhost:3001/api';

  useEffect(() => {
    if (view === 'list') {
      fetchStudies();
    }
  }, [view]);

  const fetchStudies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/studies`);
      const data = await response.json();
      setStudies(data);
    } catch (error) {
      console.error('Failed to fetch studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudy = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/studies/${id}`);
      const data = await response.json();
      setModels(data.models);
      setAnnotations(data.annotations);
      setCurrentStudyName(data.name || id);
      setCurrentStudyId(id);

      setViewportModels({ 0: data.models });
      setActiveViewportIndex(0);

      setView('viewer');
    } catch (error) {
      console.error('Failed to load study:', error);
      alert('Error loading study. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const stream = canvas.captureStream(30);
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
    } catch (e) {
      console.warn("No audio device found or permission denied");
    }

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const filename = `recording-${Date.now()}.webm`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      chunksRef.current = [];

      try {
        await fetch(`${API_URL}/studies/${currentStudyId}/videos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: filename, url: `/samples/${currentStudyId}/videos/${filename}` })
        });
      } catch (e) {
        console.error("Failed to sync video reference:", e);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAddAnnotation = async (pos: [number, number, number], modelId: string, modelName: string) => {
    const text = prompt(`New comment for ${modelName}:`);
    if (text) {
      const newAnnotation: Annotation = {
        id: Math.random().toString(36).substr(2, 9),
        modelId,
        modelName,
        position: pos,
        text,
        createdAt: Date.now(),
        author: 'User'
      };

      addAnnotation(newAnnotation);

      // Filter annotations for this specific model to save them
      const modelAnnotations = [...annotations, newAnnotation].filter(a => a.modelId === modelId);

      try {
        await fetch(`${API_URL}/studies/${currentStudyId}/annotations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId, annotations: modelAnnotations })
        });
      } catch (e) {
        console.error("Failed to sync annotation:", e);
      }
    }
  };

  const handleRemoveAnnotation = async (ann: Annotation) => {
    removeAnnotation(ann.id);

    // Filter remaining annotations for the same model to save back
    const updated = annotations.filter(a => a.id !== ann.id && a.modelId === ann.modelId);

    try {
      await fetch(`${API_URL}/studies/${currentStudyId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: ann.modelId, annotations: updated })
      });
    } catch (e) {
      console.error("Failed to sync annotation removal:", e);
    }
  };

  const handleCommentClick = (ann: Annotation) => {
    // 1. Update global visibility state
    setModels(prev => prev.map(m => ({
      ...m,
      visible: m.id === ann.modelId
    })));

    // 2. Set focus target for zoom
    setFocusTarget(ann.position);

    // 3. Update all viewports to match this visibility
    setViewportModels(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        const idx = parseInt(key);
        updated[idx] = updated[idx].map(m => ({
          ...m,
          visible: m.id === ann.modelId
        }));
      });
      return updated;
    });
  };

  const handleAddModeToViewport = (viewportIndex: number, model: ModelData) => {
    setViewportModels(prev => {
      const current = prev[viewportIndex] || [];
      if (current.find(m => m.id === model.id)) return prev;
      return {
        ...prev,
        [viewportIndex]: [...current, { ...model, visible: true, opacity: 1 }]
      };
    });
  };

  const renderPortal = () => {
    return (
      <div className="flex flex-col h-screen w-screen bg-black text-white font-sans overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-m3dz-green/10 via-transparent to-transparent pointer-events-none" />

        <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
          <div className="mb-12 text-center">
            <h1 style={{ color: '#5ce6ac', fontSize: '64px', fontWeight: 'bold', letterSpacing: '4px', fontFamily: 'Arial, sans-serif' }}>
              M3DZ
            </h1>
            <p className="text-gray-400 mt-2 tracking-[0.2em] uppercase text-sm">Medical 3D Visualization Ecosystem</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            {/* DICOM Viewer Card */}
            <a
              href="http://localhost:3000"
              className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-m3dz-green/50 transition-all hover:bg-gray-800/50 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-m3dz-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mb-6 p-4 bg-m3dz-green/10 rounded-full text-m3dz-green group-hover:bg-m3dz-green group-hover:text-black transition-colors">
                <Box size={48} />
              </div>
              <h2 className="text-2xl font-bold mb-4">DICOM Viewer</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Visualización profesional de estudios radiológicos, tomografías y resonancias con herramientas de diagnóstico avanzadas.
              </p>
              <div className="mt-8 flex items-center gap-2 text-m3dz-light font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Abrir Visor <ChevronLeft className="rotate-180" size={16} />
              </div>
            </a>

            {/* 3D Viewer Card */}
            <button
              onClick={() => setView('list')}
              className="group relative bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-m3dz-green/50 transition-all hover:bg-gray-800/50 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-m3dz-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="mb-6 p-4 bg-m3dz-green/10 rounded-full text-m3dz-green group-hover:bg-m3dz-green group-hover:text-black transition-colors">
                <Layers size={48} />
              </div>
              <h2 className="text-2xl font-bold mb-4">3D Viewer</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Visor especializado para archivos SPLAT, STL y PLY. Ideal para modelos dentales, reconstrucciones faciales y anotaciones 3D.
              </p>
              <div className="mt-8 flex items-center gap-2 text-m3dz-light font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Explorar Modelos <ChevronLeft className="rotate-180" size={16} />
              </div>
            </button>
          </div>

          <div className="mt-16 text-gray-600 text-[10px] tracking-widest uppercase">
            © 2026 M3DZ Technologies. All rights reserved.
          </div>
        </main>
      </div>
    );
  };

  const renderViewport = (index: number) => {
    return (
      <Viewport
        key={`vp-${index}`}
        index={index}
        isActive={activeViewportIndex === index}
        onSelect={setActiveViewportIndex}
        models={viewportModels[index] || []}
        annotations={annotations}
        onAddAnnotation={handleAddAnnotation}
        focusTarget={focusTarget}
      />
    );
  };

  const renderLayout = () => {
    switch (layout) {
      case '1':
        return renderViewport(0);
      case '1x2':
        return (
          <div className="grid grid-cols-2 h-full gap-1 p-1 bg-gray-900">
            {renderViewport(0)}
            {renderViewport(1)}
          </div>
        );
      case '2x2':
        return (
          <div className="grid grid-cols-2 grid-rows-2 h-full gap-1 p-1 bg-gray-900">
            {renderViewport(0)}
            {renderViewport(1)}
            {renderViewport(2)}
            {renderViewport(3)}
          </div>
        );
    }
  };

  if (view === 'portal') {
    return renderPortal();
  }

  if (view === 'list') {
    return (
      <div className="flex flex-col h-screen w-screen bg-black text-white font-sans overflow-hidden">
        <header className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('portal')}
              className="p-2 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
              title="Back to Portal"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="flex items-center gap-2" style={{ color: '#5ce6ac', fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'Arial, sans-serif' }}>
              M3DZ <span className="text-xs tracking-normal font-normal text-gray-500 ml-2" style={{ letterSpacing: '0px' }}>3D Study Browser</span>
            </h1>
          </div>
          <button onClick={fetchStudies} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
          </button>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-2xl font-semibold mb-8 text-gray-400">Available Studies</h2>
            {loading && studies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p>Loading studies from samples folder...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {studies.map((study) => (
                  <div key={study.id} onClick={() => loadStudy(study.id)} onDoubleClick={() => loadStudy(study.id)} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-m3dz-green/50 hover:bg-gray-800/50 cursor-pointer transition-all group select-none">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-m3dz-green/10 rounded-lg text-m3dz-green group-hover:bg-m3dz-green group-hover:text-black transition-colors">
                        <FolderOpen size={24} />
                      </div>
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">{study.modelCount} models</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1 truncate">{study.name}</h3>
                    <p className="text-sm text-gray-500">Click to open study</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-2 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white" title="Back to Studies">
            <ChevronLeft size={24} />
          </button>
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <h1 style={{ color: '#5ce6ac', fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'Arial, sans-serif' }}>M3DZ</h1>
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <h2 className="text-sm font-medium text-gray-400 truncate max-w-[200px]">{currentStudyName}</h2>
          <div className="h-6 w-px bg-gray-700 mx-2" />
          <div className="flex gap-2">
            <button onClick={() => setLayout('1')} className={`p-2 rounded ${layout === '1' ? 'bg-m3dz-green text-black font-bold' : 'hover:bg-gray-800'}`}><Square size={20} /></button>
            <button onClick={() => setLayout('1x2')} className={`p-2 rounded ${layout === '1x2' ? 'bg-m3dz-green text-black font-bold' : 'hover:bg-gray-800'}`}><Columns size={20} /></button>
            <button onClick={() => setLayout('2x2')} className={`p-2 rounded ${layout === '2x2' ? 'bg-m3dz-green text-black font-bold' : 'hover:bg-gray-800'}`}><Grid2X2 size={20} /></button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowComments(!showComments)} className={`p-2 rounded transition-colors ${showComments ? 'text-m3dz-light bg-gray-800' : 'text-gray-400 hover:bg-gray-800'}`}>
            <MessageSquare size={20} />
          </button>
          <button onClick={isRecording ? stopRecording : startRecording} className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-gray-800 hover:bg-gray-700'}`}>
            <Video size={18} />
            {isRecording ? 'Stop Recording' : 'Record Screen'}
          </button>
          <button className="p-2 hover:bg-gray-800 rounded text-gray-400"><Download size={20} /></button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Models */}
        <aside className="w-64 border-r border-gray-800 bg-gray-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Models List</h2>
              {models.length >= 2 && (
                <button
                  onClick={() => {
                    if (models.length >= 2) {
                      const isFirstVisible = models[0].opacity > 0.5;
                      updateModelOpacity(models[0].id, isFirstVisible ? 0 : 1);
                      updateModelOpacity(models[1].id, isFirstVisible ? 1 : 0);
                    }
                  }}
                  className="text-[10px] bg-m3dz-green/20 text-m3dz-light px-2 py-1 rounded hover:bg-m3dz-green/30 border border-m3dz-green/30"
                >
                  Toggle A/B
                </button>
              )}
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[70vh]">
              {models.map(model => (
                <div
                  key={model.id}
                  onClick={() => {
                    if (activeViewportIndex !== null) {
                      handleAddModeToViewport(activeViewportIndex, model);
                    } else {
                      setActiveViewportIndex(0);
                      handleAddModeToViewport(0, model);
                    }
                  }}
                  className="bg-gray-800 p-3 rounded-lg border border-gray-700 hover:border-m3dz-green transition-all cursor-pointer active:scale-95"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium truncate w-24">{model.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newVisible = !model.visible;
                          updateModelVisibility(model.id, newVisible);
                          setViewportModels(prev => {
                            const updated = { ...prev };
                            Object.keys(updated).forEach(key => {
                              const idx = parseInt(key);
                              updated[idx] = updated[idx].map(m => m.id === model.id ? { ...m, visible: newVisible } : m);
                            });
                            return updated;
                          });
                        }}
                        className={`p-1 rounded hover:bg-gray-700 ${model.visible ? 'text-m3dz-light' : 'text-gray-500'}`}
                      >
                        {model.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); removeModel(model.id); }} className="text-gray-500 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.01" value={model.opacity}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const newOpacity = parseFloat(e.target.value);
                      updateModelOpacity(model.id, newOpacity);
                      setViewportModels(prev => {
                        const updated = { ...prev };
                        Object.keys(updated).forEach(key => {
                          const idx = parseInt(key);
                          updated[idx] = updated[idx].map(m => m.id === model.id ? { ...m, opacity: newOpacity } : m);
                        });
                        return updated;
                      });
                    }}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-m3dz-green"
                  />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Central Viewport Area */}
        <div className="flex-1 bg-black relative overflow-hidden">
          {renderLayout()}
        </div>

        {/* Right Sidebar: Comments (Frame.io style) */}
        {showComments && (
          <aside className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <MessageSquare size={16} /> Comments
              </h2>
              <button onClick={() => setShowComments(false)} className="text-gray-500 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {annotations.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-sm italic">Double-click on a model to add a comment</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {annotations.sort((a, b) => b.createdAt - a.createdAt).map(ann => (
                    <div
                      key={ann.id}
                      onClick={() => handleCommentClick(ann)}
                      className="p-4 hover:bg-gray-800/50 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-m3dz-green"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-m3dz-green/20 flex items-center justify-center text-[10px] text-m3dz-light font-bold border border-m3dz-green/30">
                            {ann.author?.[0] || 'U'}
                          </div>
                          <span className="text-xs font-bold text-gray-300">{ann.author || 'User'}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAnnotation(ann)}
                          className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <p className="text-sm text-gray-200 mb-3 leading-relaxed">
                        {ann.text}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span className="flex items-center gap-1 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
                          <Box size={10} /> {ann.modelName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-black/20">
              <p className="text-[10px] text-gray-500 text-center">
                Select a model and double-click to pin a comment
              </p>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
};

export default App;
