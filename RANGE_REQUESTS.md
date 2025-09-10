# HTTP 206 Range Requests for Audio Streaming

This implementation adds support for HTTP 206 partial content requests to efficiently stream and seek audio files from Vercel CDN.

## Features

- **HTTP 206 Partial Content**: Fetch only the audio data needed for playback
- **Efficient Seeking**: Jump to any position in the audio without downloading the entire file
- **Progressive Loading**: Load audio data in chunks as needed
- **Vercel CDN Compatible**: Works with Vercel's edge network for fast global delivery
- **Fallback Support**: Gracefully handles servers that don't support range requests

## How It Works

### 1. Audio Fetcher (`src/utils/audioFetcher.ts`)

The `AudioFetcher` class handles all range request logic:

- **Metadata Fetching**: Gets audio duration and file size using HEAD requests
- **Range Requests**: Fetches specific byte ranges using `Range` headers
- **Blob Creation**: Creates streaming blob URLs for HTML5 audio elements
- **Caching**: Caches metadata to avoid repeated requests

### 2. Range Audio Player Hook (`src/hooks/useRangeAudioPlayer.tsx`)

The `useRangeAudioPlayer` hook provides:

- **Streaming Playback**: Uses range requests for efficient audio loading
- **Smart Preloading**: Preloads audio ranges around the current playback position
- **Seek Optimization**: Only loads the audio data needed for seeking
- **Error Handling**: Graceful fallback when range requests fail

### 3. API Route (`src/app/api/audio/[...path]/route.ts`)

The API route acts as a proxy to handle range requests:

- **Range Header Forwarding**: Passes range headers to the actual audio files
- **206 Response Handling**: Properly handles partial content responses
- **Caching Headers**: Sets appropriate cache headers for CDN optimization
- **Error Handling**: Provides proper error responses

## Usage

### Basic Usage

```tsx
import { useRangeAudioPlayer } from "@/hooks/useRangeAudioPlayer";

const tracks = ["audio/track1.mp3", "audio/track2.mp3"];

function MyAudioPlayer() {
  const {
    isPlaying,
    volume,
    seek,
    duration,
    isLoading,
    error,
    handlePlayPause,
    handleSeek,
    // ... other methods
  } = useRangeAudioPlayer(tracks);

  return (
    <div>
      {/* Your audio player UI */}
    </div>
  );
}
```

### Direct Audio Fetcher Usage

```tsx
import { audioFetcher } from "@/utils/audioFetcher";

// Get metadata
const metadata = await audioFetcher.getMetadata("audio/track.mp3");

// Fetch a specific range
const response = await audioFetcher.fetchRange("audio/track.mp3", {
  start: 1024,
  end: 2048
});

// Create streaming blob
const blobUrl = await audioFetcher.createStreamingBlob("audio/track.mp3");
```

## Testing

Visit `/test-audio` to test the range request functionality:

1. **Metadata Test**: Verifies audio duration and file size detection
2. **Range Request Test**: Tests HTTP 206 partial content responses
3. **Streaming Test**: Verifies blob URL creation for streaming

## Configuration

### Environment Variables

Set the base URL for your audio files:

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

### Vercel CDN Configuration

For optimal performance with Vercel CDN:

1. **Cache Headers**: The API route sets appropriate cache headers
2. **Edge Functions**: Range requests work with Vercel's edge network
3. **Global Distribution**: Audio files are served from the nearest edge location

## Benefits

1. **Faster Initial Load**: Only loads the beginning of audio files
2. **Efficient Seeking**: Jump to any position without full download
3. **Bandwidth Savings**: Reduces data usage for large audio files
4. **Better UX**: Smoother playback and seeking experience
5. **CDN Optimization**: Works well with Vercel's global CDN

## Browser Support

- **Modern Browsers**: Full support for range requests and blob URLs
- **Fallback**: Gracefully falls back to full file download if range requests fail
- **Mobile**: Works on mobile devices with HTML5 audio support

## Troubleshooting

### Range Requests Not Working

1. Check that your server supports range requests
2. Verify the `Accept-Ranges: bytes` header is present
3. Test with the `/test-audio` page

### Audio Not Playing

1. Check browser console for errors
2. Verify audio file paths are correct
3. Ensure audio files are accessible via the API route

### Performance Issues

1. Check network tab for range request efficiency
2. Verify CDN caching is working
3. Monitor preloading behavior
