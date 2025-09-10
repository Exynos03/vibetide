"use client";

import { useState } from "react";
import { audioFetcher } from "@/utils/audioFetcher";

export default function TestAudioPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testRangeRequests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      const testTrack = "audio/coffee-lofi-chill-lofi-music-332738.mp3";
      
      addResult("Testing metadata fetch...");
      const metadata = await audioFetcher.getMetadata(testTrack);
      addResult(`Metadata: duration=${metadata.duration}s, size=${metadata.size} bytes, acceptRanges=${metadata.acceptRanges}`);
      
      addResult("Testing range request (first 1MB)...");
      const rangeResponse = await audioFetcher.fetchRange(testTrack, { start: 0, end: 1024 * 1024 });
      addResult(`Range response status: ${rangeResponse.status}`);
      
      if (rangeResponse.status === 206) {
        addResult("✅ HTTP 206 Partial Content working!");
        const contentRange = rangeResponse.headers.get('content-range');
        addResult(`Content-Range: ${contentRange}`);
      } else {
        addResult("❌ Range requests not supported");
      }
      
      addResult("Testing streaming blob creation...");
      const blobUrl = await audioFetcher.createStreamingBlob(testTrack);
      addResult(`Streaming blob created: ${blobUrl}`);
      
      // Clean up
      URL.revokeObjectURL(blobUrl);
      addResult("Blob URL cleaned up");
      
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Audio Range Request Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test HTTP 206 Partial Content</h2>
          <p className="text-gray-600 mb-4">
            This test will verify that the audio player can make range requests to fetch audio data in chunks,
            which is essential for efficient streaming and seeking.
          </p>
          
          <button
            onClick={testRangeRequests}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Run Test"}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="bg-gray-50 rounded p-4 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">Click &quot;Run Test&quot; to see results</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
