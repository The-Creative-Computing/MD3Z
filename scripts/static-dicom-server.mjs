#!/usr/bin/env node
/**
 * Simple Static DICOMweb Server
 *
 * Serves static DICOMweb files with proper routing for OHIF Viewer.
 * Routes /studies to /studies/index.json
 *
 * Usage: node scripts/static-dicom-server.mjs [port] [directory]
 * Default: node scripts/static-dicom-server.mjs 5001 platform/app/public/dicomweb
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const PORT = parseInt(process.argv[2]) || 5001;
const DICOM_DIR = process.argv[3] || path.join(projectRoot, 'platform/app/public/dicomweb');

const MIME_TYPES = {
  '.json': 'application/dicom+json',
  '.gz': 'application/dicom+json',
  '.dcm': 'application/dicom',
  '.mht': 'multipart/related; type="application/dicom"',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveFile(res, filePath, acceptGzip = false) {
  try {
    // Try gzipped version first if client accepts it
    const gzPath = filePath + '.gz';

    if (acceptGzip && fs.existsSync(gzPath)) {
      const stats = fs.statSync(gzPath);
      if (stats.isFile()) {
        const content = fs.readFileSync(gzPath);
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', getContentType(filePath));
        res.setHeader('Content-Length', content.length);
        res.writeHead(200);
        res.end(content);
        console.log(`  ✓ Served ${gzPath} (${content.length} bytes)`);
        return true;
      }
    }

    // Try regular file
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const content = fs.readFileSync(filePath);
        let contentType = getContentType(filePath);

        // For .mht files (multipart), extract and include boundary in Content-Type
        if (path.extname(filePath).toLowerCase() === '.mht') {
          const contentStr = content.toString('utf-8', 0, 200); // Read first 200 bytes
          const boundaryMatch = contentStr.match(/--BOUNDARY_([a-f0-9-]+)/);
          if (boundaryMatch) {
            const boundary = 'BOUNDARY_' + boundaryMatch[1];
            contentType = `multipart/related; type="image/jls"; boundary="${boundary}"`;
          }
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', content.length);
        res.writeHead(200);
        res.end(content);
        console.log(`  ✓ Served ${filePath} (${content.length} bytes)`);
        return true;
      }
    }
  } catch (err) {
    console.error(`  ✗ Error serving ${filePath}:`, err.message);
  }
  return false;
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const acceptGzip = (req.headers['accept-encoding'] || '').includes('gzip');
  let urlPath = req.url.split('?')[0];

  console.log(`[${new Date().toISOString()}] ${req.method} ${urlPath}`);
  console.log(`  -> Accept-Encoding: ${req.headers['accept-encoding'] || 'none'}, acceptGzip: ${acceptGzip}`);

  // Handle DICOMweb routes
  // QIDO-RS: /studies -> /studies/index.json
  if (urlPath === '/studies' || urlPath === '/dicomweb/studies') {
    const studiesIndexPath = path.join(DICOM_DIR, 'studies', 'index.json');

    if (serveFile(res, studiesIndexPath, acceptGzip)) {
      return;
    }
  }

  // QIDO-RS: /studies/{studyUID}/series -> /studies/{studyUID}/series/index.json
  const seriesMatch = urlPath.match(/^(\/dicomweb)?\/studies\/([^/]+)\/series$/);
  if (seriesMatch) {
    const studyUID = seriesMatch[2];
    const seriesIndexPath = path.join(DICOM_DIR, 'studies', studyUID, 'series', 'index.json');

    if (serveFile(res, seriesIndexPath, acceptGzip)) {
      return;
    }
  }

  // QIDO-RS: /studies/{studyUID}/series/{seriesUID}/instances -> index.json
  const instancesMatch = urlPath.match(
    /^(\/dicomweb)?\/studies\/([^/]+)\/series\/([^/]+)\/instances$/
  );
  if (instancesMatch) {
    const studyUID = instancesMatch[2];
    const seriesUID = instancesMatch[3];
    const instancesIndexPath = path.join(DICOM_DIR, 'studies', studyUID, 'series', seriesUID, 'instances', 'index.json');

    console.log(`  -> Looking for: ${instancesIndexPath}`);
    console.log(`  -> File exists: ${fs.existsSync(instancesIndexPath)}`);
    console.log(`  -> .gz exists: ${fs.existsSync(instancesIndexPath + '.gz')}`);

    if (serveFile(res, instancesIndexPath, acceptGzip)) {
      return;
    }
  }

  // WADO-RS: Serve metadata files
  const metadataMatch = urlPath.match(
    /^(\/dicomweb)?\/studies\/([^/]+)\/series\/([^/]+)\/metadata$/
  );
  if (metadataMatch) {
    const studyUID = metadataMatch[2];
    const seriesUID = metadataMatch[3];
    const metadataPath = path.join(DICOM_DIR, 'studies', studyUID, 'series', seriesUID, 'metadata.json');

    if (serveFile(res, metadataPath, acceptGzip)) {
      return;
    }
  }

  // WADO-RS: Serve frames (redirect to bulkdata structure)
  const framesMatch = urlPath.match(/^(\/dicomweb)?\/studies\/([^/]+)\/series\/([^/]+)\/instances\/([^/]+)\/frames\/(\d+)$/);
  if (framesMatch) {
    const studyUID = framesMatch[2];
    const seriesUID = framesMatch[3];
    const instanceUID = framesMatch[4];
    const frameNumber = framesMatch[5];

    // For static DICOMweb, frames are in the instances/{instanceUID}/frames directory
    // Try with .mht extension (multipart MIME)
    const framePath = path.join(DICOM_DIR, 'studies', studyUID, 'series', seriesUID, 'instances', instanceUID, 'frames', frameNumber + '.mht');

    console.log(`  -> Looking for frame: ${framePath}`);

    if (serveFile(res, framePath, false)) {
      return;
    }

    // Also try without extension for backward compatibility
    const framePathNoExt = path.join(DICOM_DIR, 'studies', studyUID, 'series', seriesUID, 'instances', instanceUID, 'frames', frameNumber);
    if (serveFile(res, framePathNoExt, false)) {
      return;
    }
  }

  // WADO-RS: Serve instance thumbnails
  const thumbnailMatch = urlPath.match(
    /^(\/dicomweb)?\/studies\/([^/]+)\/series\/([^/]+)\/instances\/([^/]+)\/thumbnail$/
  );
  if (thumbnailMatch) {
    const studyUID = thumbnailMatch[2];
    const seriesUID = thumbnailMatch[3];
    const instanceUID = thumbnailMatch[4];
    const thumbnailPath = path.join(
      DICOM_DIR,
      'studies',
      studyUID,
      'series',
      seriesUID,
      'instances',
      instanceUID,
      'thumbnail'
    );

    if (serveFile(res, thumbnailPath, acceptGzip)) {
      return;
    }
  }

  // Default: serve file directly
  const cleanPath = urlPath.startsWith('/dicomweb') ? urlPath.slice(9) : urlPath;
  const filePath = path.join(DICOM_DIR, cleanPath);

  if (serveFile(res, filePath, acceptGzip)) {
    return;
  }

  // Try with /index.json suffix
  const indexPath = path.join(filePath, 'index.json');
  if (serveFile(res, indexPath, acceptGzip)) {
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', path: urlPath }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔════════════════════════════════════════════════════════════════╗
  ║         Static DICOMweb Server for OHIF Viewer                 ║
  ╠════════════════════════════════════════════════════════════════╣
  ║  Server running on:                                            ║
  ║    Local:   http://localhost:${PORT}                             ║
  ║    Network: http://192.168.1.100:${PORT}                        ║
  ║  DICOM directory:   ${DICOM_DIR.slice(0, 40)}...  ║
  ╠════════════════════════════════════════════════════════════════╣
  ║  Endpoints:                                                    ║
  ║    GET /studies              - List all studies                ║
  ║    GET /studies/{uid}/series - List series in study            ║
  ║    GET /studies/{uid}/series/{uid}/instances - List instances  ║
  ╠════════════════════════════════════════════════════════════════╣
  ║  📱 Mobile Access: Use the Network URL on your phone           ║
  ╚════════════════════════════════════════════════════════════════╝
  `);
});
