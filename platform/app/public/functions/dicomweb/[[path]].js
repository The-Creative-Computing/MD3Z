/**
 * Cloudflare Function to serve DICOMweb files with correct Content-Type
 * Handles .mht files (multipart/related) with dynamic boundary extraction
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Get the path after /dicomweb/
  let path = url.pathname.replace(/^\/dicomweb\//, '');
  
  // Handle frame requests: /studies/.../frames/1 -> /studies/.../frames/1.mht
  const frameMatch = path.match(/^(studies\/[^/]+\/series\/[^/]+\/instances\/[^/]+\/frames\/\d+)$/);
  if (frameMatch) {
    path = frameMatch[1] + '.mht';
  }
  
  // Construct the asset path (without /dicomweb prefix since we're serving from the root)
  const assetPath = `dicomweb/${path}`;
  
  try {
    // Try to get the asset directly from Cloudflare Pages
    const asset = await env.ASSETS.fetch(new URL(`/${assetPath}`, url.origin));
    
    if (!asset.ok) {
      return new Response(JSON.stringify({ error: 'Not found', path: assetPath }), { 
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Read the response body once
    const arrayBuffer = await asset.arrayBuffer();
    
    // Set up headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
    headers.set('Cache-Control', 'public, max-age=86400, immutable');
    
    // For .mht files, set proper Content-Type with boundary
    if (path.endsWith('.mht')) {
      // Read first 200 bytes to extract boundary
      const uint8Array = new Uint8Array(arrayBuffer);
      const header = new TextDecoder().decode(uint8Array.slice(0, 200));
      
      const boundaryMatch = header.match(/--BOUNDARY_([a-f0-9-]+)/);
      if (boundaryMatch) {
        const boundary = 'BOUNDARY_' + boundaryMatch[1];
        headers.set('Content-Type', `multipart/related; type="image/jls"; boundary="${boundary}"`);
      } else {
        headers.set('Content-Type', 'multipart/related');
      }
    } else if (path.endsWith('.json')) {
      // For JSON files
      headers.set('Content-Type', 'application/dicom+json');
    } else {
      // Copy original content type
      const originalContentType = asset.headers.get('Content-Type');
      if (originalContentType) {
        headers.set('Content-Type', originalContentType);
      }
    }
    
    // Return response with the body
    return new Response(arrayBuffer, {
      status: 200,
      headers: headers
    });
    
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response(JSON.stringify({ error: error.message, path: assetPath }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    }
  });
}
