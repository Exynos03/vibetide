/**
 * Audio fetcher utility that supports HTTP 206 partial content requests
 * for efficient streaming and seeking of audio files from Vercel CDN
 */

export interface AudioMetadata {
  duration: number;
  size: number;
  contentType: string;
  acceptRanges: boolean;
}

export interface RangeRequest {
  start: number;
  end?: number;
}

export class AudioFetcher {
  private baseUrl: string;
  private cache = new Map<string, AudioMetadata>();

  constructor(baseUrl: string = '/api/audio') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get audio metadata including duration and file size
   */
  async getMetadata(audioPath: string): Promise<AudioMetadata> {
    const cacheKey = `metadata:${audioPath}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const response = await fetch(`${this.baseUrl}/${audioPath}`, {
        method: 'HEAD',
        headers: {
          'Range': 'bytes=0-1',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      const acceptRanges = response.headers.get('accept-ranges') === 'bytes';
      
      // For audio duration, we need to make a small range request to get the file info
      const duration = await this.getAudioDuration(audioPath);

      const metadata: AudioMetadata = {
        duration,
        size: contentLength ? parseInt(contentLength, 10) : 0,
        contentType,
        acceptRanges,
      };

      this.cache.set(cacheKey, metadata);
      return metadata;
    } catch (error) {
      console.error('Error fetching audio metadata:', error);
      throw error;
    }
  }

  /**
   * Get audio duration by fetching a small portion of the file
   */
  private async getAudioDuration(audioPath: string): Promise<number> {
    try {
      // Fetch first 1MB to get audio headers and duration
      const response = await this.fetchRange(audioPath, { start: 0, end: 1024 * 1024 });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audio data: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(arrayBuffer.slice(0))
          .then((audioBuffer) => {
            resolve(audioBuffer.duration);
          })
          .catch(() => {
            // If decodeAudioData fails, try to estimate duration from file size
            // This is a fallback method
            this.estimateDurationFromSize(audioPath).then(resolve).catch(() => reject(new Error('Could not determine audio duration')));
          });
      });
    } catch {
      console.warn('Could not determine audio duration, using fallback');
      return 0;
    }
  }

  /**
   * Fallback method to estimate duration from file size
   */
  private async estimateDurationFromSize(audioPath: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/${audioPath}`, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      
      if (contentLength) {
        const sizeInBytes = parseInt(contentLength, 10);
        // Rough estimation: assume 128kbps bitrate for MP3
        const estimatedDuration = (sizeInBytes * 8) / (128 * 1000);
        return estimatedDuration;
      }
      
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Fetch a range of bytes from the audio file
   */
  async fetchRange(audioPath: string, range: RangeRequest): Promise<Response> {
    const rangeHeader = range.end 
      ? `bytes=${range.start}-${range.end}`
      : `bytes=${range.start}-`;

    const response = await fetch(`${this.baseUrl}/${audioPath}`, {
      headers: {
        'Range': rangeHeader,
      },
    });

    if (response.status !== 206 && response.status !== 200) {
      throw new Error(`Range request failed: ${response.status}`);
    }

    return response;
  }

  /**
   * Create a blob URL for a specific range of the audio file
   */
  async createRangeBlob(audioPath: string, range: RangeRequest): Promise<string> {
    try {
      const response = await this.fetchRange(audioPath, range);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error creating range blob:', error);
      throw error;
    }
  }

  /**
   * Create a streaming blob URL that can be used with HTML5 audio
   * This creates a blob that represents the entire file but only loads data as needed
   */
  async createStreamingBlob(audioPath: string): Promise<string> {
    try {
      // First, get the file size
      const metadata = await this.getMetadata(audioPath);
      
      if (!metadata.acceptRanges) {
        // If server doesn't support range requests, fall back to full fetch
        const response = await fetch(`${this.baseUrl}/${audioPath}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }

      // Create a custom blob that supports range requests
      const streamingBlob = new Blob([], { type: metadata.contentType });
      
      // Override the blob's arrayBuffer method to fetch ranges on demand
      streamingBlob.arrayBuffer = async () => {
        const response = await this.fetchRange(audioPath, { start: 0 });
        return response.arrayBuffer();
      };

      return URL.createObjectURL(streamingBlob);
    } catch (error) {
      console.error('Error creating streaming blob:', error);
      throw error;
    }
  }

  /**
   * Preload a specific range of the audio file
   */
  async preloadRange(audioPath: string, range: RangeRequest): Promise<ArrayBuffer> {
    const response = await this.fetchRange(audioPath, range);
    return response.arrayBuffer();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Create a default instance
export const audioFetcher = new AudioFetcher();
