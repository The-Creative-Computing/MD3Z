const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 3001;
const HOST = '0.0.0.0'; // Listen on all network interfaces
const SAMPLES_DIR = path.join(__dirname, 'samples');

app.use(cors());
app.use(express.json());
app.use('/samples', express.static(SAMPLES_DIR));

// Ensure standardized structure for a study folder
async function ensureStudyStructure(studyPath) {
  const annotationsDir = path.join(studyPath, 'annotations');
  const videosDir = path.join(studyPath, 'videos');
  const videosJsonPath = path.join(videosDir, 'videos.json');

  if (!(await fs.pathExists(annotationsDir))) {
    await fs.ensureDir(annotationsDir);
  }

  if (!(await fs.pathExists(videosDir))) {
    await fs.ensureDir(videosDir);
  }

  if (!(await fs.pathExists(videosJsonPath))) {
    await fs.writeJson(videosJsonPath, []);
  }
}

app.get('/api/studies', async (req, res) => {
  try {
    await fs.ensureDir(SAMPLES_DIR);
    const entries = await fs.readdir(SAMPLES_DIR, { withFileTypes: true });
    const studies = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const studyPath = path.join(SAMPLES_DIR, entry.name);
        await ensureStudyStructure(studyPath);

        const files = await fs.readdir(studyPath);
        const models = files.filter(f => 
          f.toLowerCase().endsWith('.stl') || 
          f.toLowerCase().endsWith('.ply') || 
          f.toLowerCase().endsWith('.splat')
        );

        studies.push({
          id: entry.name,
          name: entry.name,
          path: `/samples/${entry.name}`,
          modelCount: models.length
        });
      }
    }

    res.json(studies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to list studies' });
  }
});

app.get('/api/studies/:id', async (req, res) => {
  try {
    const studyId = req.params.id;
    const studyPath = path.join(SAMPLES_DIR, studyId);
    
    if (!(await fs.pathExists(studyPath))) {
      return res.status(404).json({ error: 'Study not found' });
    }

    // Get the host from the request to generate proper URLs for network access
    const protocol = req.protocol || 'http';
    const host = req.get('host') || `localhost:${PORT}`;
    const baseUrl = `${protocol}://${host}`;

    const files = await fs.readdir(studyPath);
    const models = files.filter(f => 
      f.toLowerCase().endsWith('.stl') || 
      f.toLowerCase().endsWith('.ply') || 
      f.toLowerCase().endsWith('.splat') ||
      f.toLowerCase().endsWith('.ksplat')
    ).map(f => {
      const lower = f.toLowerCase();
      let type = 'ply';
      
      if (lower.endsWith('.stl')) {
        type = 'stl';
      } else if (lower.endsWith('.splat') || lower.endsWith('.ksplat')) {
        // .splat and .ksplat files are always Gaussian Splats
        type = 'splat';
      } else if (lower.endsWith('.ply')) {
        // .ply files are regular meshes or point clouds (NOT Gaussian Splats)
        type = 'ply';
      }
      
      return {
        id: f,
        name: f,
        url: `${baseUrl}/samples/${studyId}/${f}`,
        type,
        opacity: 1,
        visible: true,
        position: [0, 0, 0],
        rotation: type === 'splat' ? [3.14159, 0, 0] : [0, 0, 0], // Splats rotated 180° on X axis
        scale: type === 'splat' ? [10, 10, 10] : [1, 1, 1] // Splats start at 10x scale
      };
    });

    // Load all annotations from the annotations/ folder
    const annotationsDir = path.join(studyPath, 'annotations');
    const annFiles = await fs.readdir(annotationsDir);
    let allAnnotations = [];
    
    for (const f of annFiles) {
      if (f.endsWith('.json')) {
        const content = await fs.readJson(path.join(annotationsDir, f));
        if (Array.isArray(content)) {
          allAnnotations = [...allAnnotations, ...content];
        }
      }
    }

    const videos = await fs.readJson(path.join(studyPath, 'videos', 'videos.json'));

    res.json({
      id: studyId,
      name: studyId,
      models,
      annotations: allAnnotations,
      videos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load study' });
  }
});

// Save annotation for a specific model
app.post('/api/studies/:id/annotations', async (req, res) => {
  try {
    const studyId = req.params.id;
    const { modelId, annotations } = req.body; // Array of annotations for THIS model
    
    if (!modelId) return res.status(400).json({ error: 'modelId required' });
    
    const annFilePath = path.join(SAMPLES_DIR, studyId, 'annotations', `${modelId}.json`);
    
    await fs.writeJson(annFilePath, annotations);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save annotations' });
  }
});

app.post('/api/studies/:id/videos', async (req, res) => {
  try {
    const studyId = req.params.id;
    const videoData = req.body;
    const videosJsonPath = path.join(SAMPLES_DIR, studyId, 'videos', 'videos.json');
    
    const videos = await fs.readJson(videosJsonPath);
    videos.push({
      ...videoData,
      timestamp: Date.now()
    });
    
    await fs.writeJson(videosJsonPath, videos);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save video reference' });
  }
});

app.listen(PORT, HOST, () => {
  // Get local IP address
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }
  
  console.log(`\n🚀 Study API running:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIP}:${PORT}\n`);
});
