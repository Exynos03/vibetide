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

    try {
        const spotifyApi = getSpotifyClient(accessToken);

        // Get user's playlists
        const userPlaylists = await spotifyApi.getUserPlaylists({ limit: 20 });

        // Get featured lofi playlists
        const featuredPlaylists = await spotifyApi.searchPlaylists('lofi', { limit: 10 });

        return NextResponse.json({
            userPlaylists: userPlaylists.body.items,
            featuredPlaylists: featuredPlaylists.body.playlists?.items || [],
        });
    } catch (error) {
        console.error('Error fetching playlists:', error);
        return NextResponse.json(
            { error: 'Failed to fetch playlists' },
            { status: 500 }
        );
    }
}
