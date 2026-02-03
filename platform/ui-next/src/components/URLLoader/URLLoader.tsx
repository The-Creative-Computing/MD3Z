import React, { useState } from 'react';
import { Input } from '../Input';
import { Button, ButtonEnums } from '@ohif/ui';
import { Icons } from '../Icons';

interface URLLoaderProps {
  onLoadURL: (url: string, studyInstanceUID?: string) => void;
  onClose: () => void;
}

/**
 * URLLoader - Componente para cargar DICOMs desde URL
 * Soporta:
 * - URLs de DICOMweb con StudyInstanceUIDs
 * - URLs directas a endpoints DICOMweb
 */
export const URLLoader: React.FC<URLLoaderProps> = ({ onLoadURL, onClose }) => {
  const [url, setUrl] = useState('');
  const [studyUID, setStudyUID] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateURL = (inputUrl: string): boolean => {
    try {
      new URL(inputUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handleLoad = async () => {
    setError('');

    if (!url.trim()) {
      setError('Por favor ingresa una URL válida');
      return;
    }

    if (!validateURL(url)) {
      setError('URL inválida. Debe incluir protocolo (http:// o https://)');
      return;
    }

    setLoading(true);

    try {
      // Extraer StudyInstanceUID de la URL si existe
      const urlObj = new URL(url);
      const urlParams = new URLSearchParams(urlObj.search);
      const studyFromURL = urlParams.get('StudyInstanceUIDs') || studyUID;

      onLoadURL(url, studyFromURL);
    } catch (err) {
      setError('Error al procesar la URL');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLoad();
    }
  };

  return (
    <div className="bg-bkg-low flex flex-col rounded-lg p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Cargar DICOM desde URL</h2>
        <button
          onClick={onClose}
          className="text-common-light hover:text-white transition-colors"
        >
          <Icons.Close className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-4">
        {/* URL Input */}
        <div>
          <label className="text-common-light mb-2 block text-sm">
            URL del DICOMweb Server o Endpoint:
          </label>
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://ejemplo.com/dicomweb"
            className="w-full"
            autoFocus
          />
          <p className="text-common-dark mt-1 text-xs">
            Ejemplos: https://server.example.com/dicomweb
          </p>
        </div>

        {/* Study UID Input (opcional) */}
        <div>
          <label className="text-common-light mb-2 block text-sm">
            Study Instance UID (opcional):
          </label>
          <Input
            type="text"
            value={studyUID}
            onChange={(e) => setStudyUID(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="1.2.840.113619.2.55.3..."
            className="w-full"
          />
          <p className="text-common-dark mt-1 text-xs">
            Si la URL no contiene el StudyInstanceUID, puedes ingresarlo aquí
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border-red-500 flex items-center gap-2 rounded border p-3 text-red-200">
            <Icons.Info className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type={ButtonEnums.type.secondary}
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type={ButtonEnums.type.primary}
            onClick={handleLoad}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <Icons.LoadingSpinner className="mr-2 h-4 w-4" />
                Cargando...
              </>
            ) : (
              <>
                <Icons.Launch className="mr-2 h-4 w-4" />
                Cargar Estudio
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-primary-dark/20 border-primary-main mt-4 rounded border p-3">
        <p className="text-common-light text-xs">
          <strong>💡 Tip:</strong> Puedes cargar estudios desde servidores DICOMweb públicos o
          privados. Asegúrate de que el servidor permita CORS para acceso desde el navegador.
        </p>
      </div>
    </div>
  );
};

export default URLLoader;
