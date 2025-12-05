import SpotifyWebApi from 'spotify-web-api-node';

// Server-side Spotify API client
// This should ONLY be used in API routes, never on the client

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

// Scopes needed for Web Playback SDK and user data
export const SPOTIFY_SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-library-read',
    'playlist-read-private',
    'playlist-read-collaborative',
].join(' ');

export function getSpotifyClient(accessToken?: string): SpotifyWebApi {
    if (accessToken) {
        spotifyApi.setAccessToken(accessToken);
    }
    return spotifyApi;
}

// PKCE Helper Functions
export function generateCodeVerifier(length: number = 128): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);

    return Buffer.from(digest)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export function createAuthorizationURL(codeChallenge: string): string {
    const params = new URLSearchParams({
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        response_type: 'code',
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
        scope: SPOTIFY_SCOPES,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, codeVerifier: string) {
    try {
        console.log('🔄 Attempting PKCE token exchange with Spotify API...');
        console.log('📋 Config:', {
            clientId: process.env.SPOTIFY_CLIENT_ID?.substring(0, 10) + '...',
            redirectUri: process.env.SPOTIFY_REDIRECT_URI,
        });

        const params = new URLSearchParams({
            client_id: process.env.SPOTIFY_CLIENT_ID!,
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
            code_verifier: codeVerifier,
        });

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Token exchange failed:', errorData);
            throw new Error(`Token exchange failed: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('✅ Token exchange successful');

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresIn: data.expires_in,
        };
    } catch (error: any) {
        console.error('❌ Token exchange failed:', {
            message: error.message,
        });
        throw error;
    }
}

export async function refreshAccessToken(refreshToken: string) {
    try {
        const params = new URLSearchParams({
            client_id: process.env.SPOTIFY_CLIENT_ID!,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        });

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();

        return {
            accessToken: data.access_token,
            expiresIn: data.expires_in,
        };
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
}
