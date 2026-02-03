import React, { useEffect, useRef, useState } from 'react';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSTLReader from '@kitware/vtk.js/IO/Geometry/STLReader';

interface STLViewportProps {
  displaySets: any[];
  viewportIndex: number;
  dataSource: any;
  servicesManager: any;
}

const STLViewport: React.FC<STLViewportProps> = ({
  displaySets,
  viewportIndex,
  servicesManager,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fullScreenRendererRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !displaySets || displaySets.length === 0) {
      return;
    }

    const displaySet = displaySets[0];
    
    console.log('STLViewport: displaySet =', displaySet);
    
    // Check if this is an STL file
    if (!displaySet.stlUrl && !displaySet.stlData) {
      // Try to get from instances
      if (displaySet.instances && displaySet.instances.length > 0) {
        const instance = displaySet.instances[0];
        if (instance.stlData) {
          displaySet.stlData = instance.stlData;
        } else if (instance.stlUrl) {
          displaySet.stlUrl = instance.stlUrl;
        }
      }
      
      if (!displaySet.stlUrl && !displaySet.stlData) {
        setError('No STL file available');
        setLoading(false);
        return;
      }
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

    // Load STL file
    const loadSTL = async () => {
      try {
        if (displaySet.stlUrl) {
          // Load from URL
          const response = await fetch(displaySet.stlUrl);
          const arrayBuffer = await response.arrayBuffer();
          reader.parseAsArrayBuffer(arrayBuffer);
        } else if (displaySet.stlData) {
          // Load from arraybuffer
          reader.parseAsArrayBuffer(displaySet.stlData);
        }

        // Create mapper and actor
        const mapper = vtkMapper.newInstance();
        mapper.setInputConnection(reader.getOutputPort());

        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);

        // Set default material properties
        actor.getProperty().setColor(0.8, 0.8, 0.8);
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
        setError(`Error loading STL: ${err.message}`);
        setLoading(false);
      }
    };

    loadSTL();

    // Cleanup on unmount
    return () => {
      if (fullScreenRendererRef.current) {
        fullScreenRendererRef.current.delete();
        fullScreenRendererRef.current = null;
      }
    };
  }, [displaySets]);

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#ff6b6b',
          backgroundColor: '#1a1a1a',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Error Loading STL</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            zIndex: 1000,
          }}
        >
          <div style={{ textAlign: 'center', color: '#5ce6ac' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔄</div>
            <div style={{ fontSize: '18px' }}>Loading 3D Model...</div>
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
  );
};

export default STLViewport;
