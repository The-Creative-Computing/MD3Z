#!/usr/bin/env node
/**
 * Production Server for OHIF Viewer + Static DICOMweb
 * 
 * Serves both the OHIF Viewer app and DICOMweb static files.
 * Designed for deployment on Railway, Render, or similar platforms.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT) || 3000;
const APP_DIR = path.join(__dirname, 'platform/app/dist');
const DICOM_DIR = path.join(__dirname, 'platform/app/public/dicomweb');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.mht': 'multipart/related',
  '.dcm': 'application/dicom',
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveDICOMFile(res, filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath);
    let contentType = getContentType(filePath);
    
    // For .mht files, extract boundary and set proper Content-Type
    if (path.extname(filePath).toLowerCase() === '.mht') {
      const contentStr = content.toString('utf-8', 0, 200);
      const boundaryMatch = contentStr.match(/--BOUNDARY_([a-f0-9-]+)/);
      if (boundaryMatch) {
        const boundary = 'BOUNDARY_' + boundaryMatch[1];
        contentType = `multipart/related; type="image/jls"; boundary="${boundary}"`;
      }
    } else if (filePath.endsWith('.json') || filePath.endsWith('index.json')) {
      contentType = 'application/dicom+json';
    }
    
    res.setHeader('Content-Type', contentType);
    res.end(content);
    return true;
  }
  return false;
}

function serveStaticFile(res, filePath) {
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      const content = fs.readFileSync(filePath);
      res.setHeader('Content-Type', getContentType(filePath));
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.end(content);
      return true;
    }
  }
  return false;
}

const server = http.createServer((req, res) => {
  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let urlPath = req.url.split('?')[0];
  console.log(`[${new Date().toISOString()}] ${req.method} ${urlPath}`);

  // ===== DICOMweb Routes =====
  
  // QIDO-RS: /dicomweb/studies -> index.json
  if (urlPath === '/dicomweb/studies') {
    const studiesPath = path.join(DICOM_DIR, 'studies', 'index.json');
    if (serveDICOMFile(res, studiesPath)) return;
  }

  // QIDO-RS: /dicomweb/studies/{studyUID}/series -> index.json
  const seriesMatch = urlPath.match(/^\/dicomweb\/studies\/([^/]+)\/series$/);
  if (seriesMatch) {
    const studyUID = seriesMatch[1];
    const seriesPath = path.join(DICOM_DIR, 'studies', studyUID, 'series', 'index.json');
    if (serveDICOMFile(res, seriesPath)) return;
  }

  // QIDO-RS: /dicomweb/studies/{studyUID}/series/{seriesUID}/instances -> index.json
  const instancesMatch = urlPath.match(/^\/dicomweb\/studies\/([^/]+)\/series\/([^/]+)\/instances$/);
  if (instancesMatch) {
    const [, studyUID, seriesUID] = instancesMatch;
    const instancesPath = path.join(DICOM_DIR, 'studies', studyUID, 'series', seriesUID, 'instances', 'index.json');
    if (serveDICOMFile(res, instancesPath)) return;
  }

  // WADO-RS: /dicomweb/studies/{studyUID}/series/{seriesUID}/metadata
  const metadataMatch = urlPath.match(/^\/dicomweb\/studies\/([^/]+)\/series\/([^/]+)\/metadata$/);
  if (metadataMatch) {
    const [, studyUID, seriesUID] = metadataMatch;
    const metadataPath = path.join(DICOM_DIR, 'studies', studyUID, 'series', seriesUID, 'metadata.json');
    if (serveDICOMFile(res, metadataPath)) return;
  }

  // WADO-RS: /dicomweb/studies/{studyUID}/series/{seriesUID}/instances/{instanceUID}/frames/{frameNumber}
  const frameMatch = urlPath.match(/^\/dicomweb\/studies\/([^/]+)\/series\/([^/]+)\/instances\/([^/]+)\/frames\/(\d+)$/);
  if (frameMatch) {
    const [, studyUID, seriesUID, instanceUID, frameNumber] = frameMatch;
    const framePath = path.join(DICOM_DIR, 'studies', studyUID, 'series', seriesUID, 'instances', instanceUID, 'frames', `${frameNumber}.mht`);
    if (serveDICOMFile(res, framePath)) return;
  }

  // WADO-RS: /dicomweb/studies/{studyUID}/series/{seriesUID}/instances/{instanceUID}/thumbnail
  const thumbnailMatch = urlPath.match(/^\/dicomweb\/studies\/([^/]+)\/series\/([^/]+)\/instances\/([^/]+)\/thumbnail$/);
  if (thumbnailMatch) {
    const [, studyUID, seriesUID, instanceUID] = thumbnailMatch;
    const thumbnailPath = path.join(DICOM_DIR, 'studies', studyUID, 'series', seriesUID, 'instances', instanceUID, 'thumbnail');
    if (serveDICOMFile(res, thumbnailPath)) return;
  }

  // ===== Viewer Static Files =====
  
  // Try to serve from dist directory
  const appFilePath = path.join(APP_DIR, urlPath === '/' ? 'index.html' : urlPath.slice(1));
  
  if (serveStaticFile(res, appFilePath)) {
    return;
  }

  // SPA fallback: serve index.html for all non-API routes
  if (!urlPath.startsWith('/dicomweb')) {
    const indexPath = path.join(APP_DIR, 'index.html');
    if (serveStaticFile(res, indexPath)) {
      return;
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', path: urlPath }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           M3DZ DICOM Viewer - Production Server                ║
╠════════════════════════════════════════════════════════════════╣
║  Server running at: http://0.0.0.0:${PORT}                        ║
║  Viewer directory:  ${APP_DIR}                    ║
║  DICOM directory:   ${DICOM_DIR}                  ║
╠════════════════════════════════════════════════════════════════╣
║  Routes:                                                       ║
║    /                         - OHIF Viewer App                 ║
║    /dicomweb/*               - DICOMweb API                    ║
╚════════════════════════════════════════════════════════════════╝
`);
});
