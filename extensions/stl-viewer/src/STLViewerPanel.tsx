import React, { useRef, useState, useEffect } from 'react';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSTLReader from '@kitware/vtk.js/IO/Geometry/STLReader';

const STLViewerPanel = () => {
  const containerRef = useRef(null);
  const [stlFile, setStlFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fullScreenRendererRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith('.stl')) {
      setStlFile(file);
      setError(null);
      loadSTL(file);
    } else {
      setError('Por favor selecciona un archivo .stl válido');
    }
  };

  const loadSTL = async (file) => {
    setLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Clean up previous renderer
      if (fullScreenRendererRef.current) {
        fullScreenRendererRef.current.delete();
        fullScreenRendererRef.current = null;
      }

      // Create VTK renderer
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        container: containerRef.current,
        background: [0.1, 0.1, 0.1],
      });

      fullScreenRendererRef.current = fullScreenRenderer;

      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      // Create STL reader
      const reader = vtkSTLReader.newInstance();
      reader.parseAsArrayBuffer(arrayBuffer);

      // Create mapper and actor
      const mapper = vtkMapper.newInstance();
      mapper.setInputConnection(reader.getOutputPort());

      const actor = vtkActor.newInstance();
      actor.setMapper(mapper);

      // Set material properties (verde como el tema)
      actor.getProperty().setColor(0.36, 0.9, 0.67); // Verde #5ce6ac
      actor.getProperty().setAmbient(0.3);
      actor.getProperty().setDiffuse(0.7);
      actor.getProperty().setSpecular(0.3);
      actor.getProperty().setSpecularPower(30);

      // Add actor to renderer
      renderer.addActor(actor);

      // Reset camera
      renderer.resetCamera();
      renderWindow.render();

      setLoading(false);
    } catch (err) {
      console.error('Error loading STL:', err);
      setError(`Error cargando STL: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (fullScreenRendererRef.current) {
        fullScreenRendererRef.current.delete();
        fullScreenRendererRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      backgroundColor: '#0d1f1a',
      color: '#fff',
    }}>
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#1a3a2e',
        borderBottom: '2px solid #5ce6ac',
      }}>
        <h2 style={{ 
          margin: '0 0 12px 0', 
          color: '#5ce6ac',
          fontSize: '20px',
          fontWeight: 'bold',
        }}>
          🎨 Visor STL 3D
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{
            backgroundColor: '#5ce6ac',
            color: '#1a3a2e',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#4dd679'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#5ce6ac'}
          >
            📁 Seleccionar archivo STL
            <input
              type="file"
              accept=".stl,.STL,model/stl,application/sla"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </label>
          
          {stlFile && (
            <span style={{ 
              fontSize: '14px', 
              color: '#a0a0a0',
            }}>
              {stlFile.name}
            </span>
          )}
        </div>
      </div>

      {/* Viewer Area */}
      <div style={{ 
        flex: 1, 
        position: 'relative',
        minHeight: '400px',
      }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0d1f1a',
            zIndex: 1000,
          }}>
            <div style={{ textAlign: 'center', color: '#5ce6ac' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
              <div style={{ fontSize: '18px' }}>Cargando modelo 3D...</div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0d1f1a',
            zIndex: 999,
          }}>
            <div style={{ textAlign: 'center', color: '#ff6b6b' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>Error</div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>{error}</div>
            </div>
          </div>
        )}

        {!stlFile && !loading && !error && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0d1f1a',
          }}>
            <div style={{ textAlign: 'center', color: '#5ce6ac', padding: '40px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎨</div>
              <div style={{ fontSize: '24px', marginBottom: '12px', fontWeight: 'bold' }}>
                Selecciona un archivo STL
              </div>
              <div style={{ fontSize: '14px', color: '#a0a0a0', lineHeight: '1.6' }}>
                Haz clic en el botón de arriba para cargar<br/>
                un modelo 3D (implante, guía quirúrgica, etc.)
              </div>
              <div style={{ 
                marginTop: '24px', 
                padding: '16px', 
                backgroundColor: 'rgba(92, 230, 172, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#a0a0a0',
              }}>
                <div style={{ marginBottom: '8px', color: '#5ce6ac', fontWeight: 'bold' }}>
                  Controles 3D:
                </div>
                <div>🖱️ Rotar: Click izquierdo + arrastrar</div>
                <div>🔍 Zoom: Scroll del mouse</div>
                <div>✋ Pan: Click derecho + arrastrar</div>
              </div>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>
    </div>
  );
};

export default STLViewerPanel;
