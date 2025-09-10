import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const audioPath = resolvedParams.path.join('/');
    const range = request.headers.get('range');
    
    // Construct the full URL to your audio files
    // This assumes your audio files are served from the public directory
    const audioUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${audioPath}`;
    
    // Forward the request to the actual audio file with range headers
    const response = await fetch(audioUrl, {
      headers: {
        'Range': range || '',
        'User-Agent': request.headers.get('user-agent') || 'Vibetide-Audio-Player',
      },
    });

    if (!response.ok) {
      return new NextResponse('Audio not found', { status: 404 });
    }

    // Get the response body
    const audioBuffer = await response.arrayBuffer();
    
    // Get content type from the original response
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    
    // Create response headers
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=31536000');
    
    // If this was a range request, add range response headers
    if (range && response.status === 206) {
      const contentRange = response.headers.get('content-range');
      const contentLength = response.headers.get('content-length');
      
      if (contentRange) {
        responseHeaders.set('Content-Range', contentRange);
      }
      if (contentLength) {
        responseHeaders.set('Content-Length', contentLength);
      }
      
      return new NextResponse(audioBuffer, {
        status: 206,
        headers: responseHeaders,
      });
    }
    
    // Regular response
    responseHeaders.set('Content-Length', audioBuffer.byteLength.toString());
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('Audio API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const audioPath = resolvedParams.path.join('/');
    const audioUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${audioPath}`;
    
    // Make a HEAD request to get metadata
    const response = await fetch(audioUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'Vibetide-Audio-Player',
      },
    });

    if (!response.ok) {
      return new NextResponse('Audio not found', { status: 404 });
    }

    // Forward the headers
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
    responseHeaders.set('Content-Length', response.headers.get('content-length') || '0');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Cache-Control', 'public, max-age=31536000');
    
    return new NextResponse(null, {
      status: 200,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('Audio HEAD API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
