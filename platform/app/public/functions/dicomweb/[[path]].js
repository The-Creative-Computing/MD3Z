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
  
  // Construct the full path to the file
  const filePath = `/dicomweb/${path}`;
  
  try {
    // Fetch the file from the static assets
    const assetUrl = new URL(filePath, url.origin);
    const response = await fetch(assetUrl.toString(), {
      cf: {
        cacheEverything: true,
        cacheTtl: 86400, // 1 day
      }
    });
    
    if (!response.ok) {
      return new Response('Not found', { status: 404 });
    }
    
    // Clone response to modify headers
    const newResponse = new Response(response.body, response);
    
    // Set CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
    
    // For .mht files, set proper Content-Type with boundary
    if (path.endsWith('.mht')) {
      // Read first 200 bytes to extract boundary
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const header = new TextDecoder().decode(uint8Array.slice(0, 200));
      
      const boundaryMatch = header.match(/--BOUNDARY_([a-f0-9-]+)/);
      if (boundaryMatch) {
        const boundary = 'BOUNDARY_' + boundaryMatch[1];
        newResponse.headers.set('Content-Type', `multipart/related; type="image/jls"; boundary="${boundary}"`);
      } else {
        newResponse.headers.set('Content-Type', 'multipart/related');
      }
      
      // Return response with the original body (we already read it)
      return new Response(arrayBuffer, {
        status: newResponse.status,
        headers: newResponse.headers
      });
    }
    
    // For JSON files
    if (path.endsWith('.json')) {
      newResponse.headers.set('Content-Type', 'application/dicom+json');
    }
    
    return newResponse;
    
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('Internal Server Error', { status: 500 });
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
