import React, { Suspense, useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, useProgress, Center, Environment } from '@react-three/drei';
import { RefreshCw } from 'lucide-react';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
// @ts-ignore
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import type { ModelData, Annotation } from '../types';

function Loader() {
  const { progress } = useProgress();
  return <Html center className="text-white bg-black/50 p-2 rounded">{progress.toFixed(0)}% loaded</Html>;
}

interface ModelProps {
  model: ModelData;
  onDoubleClick: (pos: [number, number, number], modelId: string, modelName: string) => void;
}

const Model: React.FC<ModelProps> = ({ model, onDoubleClick }) => {
  const { scene } = useThree();
  const geometry = useLoader(
    model.type === 'stl' ? STLLoader : PLYLoader,
    model.url
  );

  const material = useMemo(() => {
    const hasVertexColors = model.type === 'ply';
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: model.opacity,
      vertexColors: hasVertexColors,
      side: THREE.DoubleSide,
      roughness: 1.0,
      metalness: 0.0,
      flatShading: false,
    });
  }, [model.opacity, model.type]);

  return (
    <mesh 
      geometry={geometry} 
      material={material} 
      visible={model.visible}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick([e.point.x, e.point.y, e.point.z], model.id, model.name);
      }}
    />
  );
};

const SplatModel: React.FC<{ model: ModelData }> = ({ model }) => {
  const { scene, camera, gl } = useThree();
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    let viewer: any = null;
    
    try {
      viewer = new GaussianSplats3D.Viewer({
        selfContained: false,
        useBuiltInControls: false,
        rootElement: gl.domElement.parentElement!,
        renderer: gl,
        camera: camera as THREE.PerspectiveCamera,
        scene: scene,
        ignoreDevicePixelRatio: false,
      });

      viewer.addSplatScene(model.url, {
        progressiveLoad: true,
        showLoadingUI: false
      }).then(() => {
        viewerRef.current = viewer;
      });
    } catch (err) {
      console.error("Error initializing SPLAT viewer:", err);
    }

    return () => {
      if (viewer) {
        // Splat viewer cleanup
      }
    };
  }, [model.url, scene, camera, gl]);

  return null;
};

// Componente para encuadrar la cámara automáticamente
const CameraFramer: React.FC<{ models: ModelData[], resetKey: number }> = ({ models, resetKey }) => {
  const { camera, controls } = useThree();
  const initialFramed = useRef(false);
  const lastResetKey = useRef(resetKey);
  
  useEffect(() => {
    // Solo encuadramos automáticamente al cargar el estudio o cambiar de modelo significativamente
    if (models.length === 0) {
      initialFramed.current = false;
      return;
    }

    // Si el resetKey cambió, forzamos un re-encuadre
    if (resetKey !== lastResetKey.current) {
      initialFramed.current = false;
      lastResetKey.current = resetKey;
    }

    // Si ya hemos encuadrado y el número de modelos no ha cambiado drásticamente, no lo volvemos a hacer automáticamente
    if (initialFramed.current) return;

    const timer = setTimeout(() => {
      const box = new THREE.Box3();
      let hasGeometry = false;

      camera.parent?.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.geometry) {
          box.expandByObject(obj);
          hasGeometry = true;
        }
      });

      if (hasGeometry) {
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        
        const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 2.5; 

        if (controls) {
          const orbitControls = controls as any;
          orbitControls.target.copy(center);
          camera.position.set(center.x, center.y, center.z + cameraZ);
          orbitControls.update();
          initialFramed.current = true;
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [models, camera, controls, resetKey]);

  return null;
};

// Componente para enfocar un punto específico (zoom a comentario)
const CameraFocuser: React.FC<{ target: [number, number, number] | null }> = ({ target }) => {
  const { camera, controls } = useThree();
  
  useEffect(() => {
    if (!target || !controls) return;

    const orbitControls = controls as any;
    const targetVec = new THREE.Vector3(...target);
    
    // Calcular una posición de cámara cercana al punto
    // Mantenemos la dirección actual de la cámara pero nos acercamos al punto
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    // Queremos estar a una distancia media del punto
    const zoomDistance = 20.0; // Ajustado: otro 60% menos de zoom (distancia aumentada)
    const newPos = targetVec.clone().sub(direction.multiplyScalar(zoomDistance));

    // Animación simple (sin librerías externas de tweening por ahora para evitar dependencias extra)
    // En una app real usaríamos gsap o react-spring
    orbitControls.target.copy(targetVec);
    camera.position.copy(newPos);
    orbitControls.update();

  }, [target, camera, controls]);

  return null;
};

interface ViewportProps {
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  models: ModelData[];
  annotations: Annotation[];
  onAddAnnotation: (pos: [number, number, number], modelId: string, modelName: string) => void;
  focusTarget: [number, number, number] | null;
}

export const Viewport: React.FC<ViewportProps> = ({ 
  index, 
  isActive, 
  onSelect, 
  models, 
  annotations, 
  onAddAnnotation,
  focusTarget
}) => {
  const [resetKey, setResetKey] = useState(0);

  const handleDoubleClick = (e: any) => {
    // Evento genérico del canvas (opcional)
  };

  const handleResetView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResetKey(prev => prev + 1);
  };

  return (
    <div 
      className={`w-full h-full relative border-2 overflow-hidden transition-colors cursor-crosshair ${
        isActive ? 'border-m3dz-green shadow-[0_0_15px_rgba(11,148,68,0.3)]' : 'border-gray-800'
      }`}
      onClick={() => onSelect(index)}
    >
      <div className="absolute top-2 left-2 z-10 bg-black/50 px-2 py-0.5 rounded text-[10px] text-gray-400 pointer-events-none">
        Viewport {index + 1}
      </div>
      
      <button 
        onClick={handleResetView}
        className="absolute top-2 right-2 z-10 p-1.5 bg-black/50 hover:bg-m3dz-green hover:text-black rounded-lg border border-white/10 text-gray-400 transition-all active:scale-90"
        title="Reset View"
      >
        <RefreshCw size={14} />
      </button>

      <Canvas gl={{ antialias: true }} shadows>
        <color attach="background" args={['#000000']} />
        <PerspectiveCamera makeDefault />
        <OrbitControls enablePan={true} enableZoom={true} makeDefault />
        
        <CameraFramer models={models} resetKey={resetKey} />
        <CameraFocuser target={focusTarget} />
        
        {/* Iluminación Global y de Estudio */}
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 5, 5]} intensity={1.73} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.86} />
        <pointLight position={[0, -5, 0]} intensity={0.72} color="#m3dz-light" />
        
        <Suspense fallback={<Loader />}>
          {models.filter(m => m.visible).map((model) => (
            model.type === 'splat' ? (
              <SplatModel key={model.id} model={model} />
            ) : (
              <Model 
                key={model.id} 
                model={model} 
                onDoubleClick={onAddAnnotation}
              />
            )
          ))}
        </Suspense>

        {annotations.map((ann) => (
          <Html key={ann.id} position={ann.position}>
            <div className="bg-black/80 text-white p-1 px-2 rounded text-xs whitespace-nowrap border border-white/20 shadow-lg transform -translate-x-1/2 -translate-y-full mb-2 pointer-events-none select-none">
              {ann.text}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black/80"></div>
            </div>
          </Html>
        ))}
      </Canvas>
    </div>
  );
};
