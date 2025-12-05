import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyClient } from '@/lib/spotify-client';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const accessToken = request.cookies.get('spotify_access_token')?.value;

    if (!accessToken) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    const { id } = await params;

    if (!id) {
        return NextResponse.json(
            { error: 'Track ID required' },
            { status: 400 }
        );
    }

    try {
        const spotifyApi = getSpotifyClient(accessToken);
        const analysis = await spotifyApi.getAudioAnalysisForTrack(id);

        return NextResponse.json(analysis.body);
    } catch (error) {
        console.error('Error fetching audio analysis:', error);
        return NextResponse.json(
            { error: 'Failed to fetch audio analysis' },
            { status: 500 }
        );
    }
}
