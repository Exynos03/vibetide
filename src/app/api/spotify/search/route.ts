import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyClient } from '@/lib/spotify-client';

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get('spotify_access_token')?.value;

    if (!accessToken) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'track';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
        return NextResponse.json(
            { error: 'Query parameter required' },
            { status: 400 }
        );
    }

    try {
        const spotifyApi = getSpotifyClient(accessToken);
        const result = await spotifyApi.search(query, [type as any], { limit });

        return NextResponse.json({
            tracks: result.body.tracks?.items || [],
            artists: result.body.artists?.items || [],
            albums: result.body.albums?.items || [],
            playlists: result.body.playlists?.items || [],
        });
    } catch (error) {
        console.error('Error searching Spotify:', error);
        return NextResponse.json(
            { error: 'Failed to search Spotify' },
            { status: 500 }
        );
    }
}
