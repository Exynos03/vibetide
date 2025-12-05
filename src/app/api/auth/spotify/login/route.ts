import { NextRequest, NextResponse } from 'next/server';
import { generateCodeVerifier, generateCodeChallenge, createAuthorizationURL } from '@/lib/spotify-client';

export async function GET() {
    try {
        // Generate PKCE verifier and challenge
        const codeVerifier = generateCodeVerifier(128);
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // Create authorization URL with PKCE
        const authUrl = createAuthorizationURL(codeChallenge);

        // Create response with redirect
        const response = NextResponse.redirect(authUrl);

        // Store code verifier in cookie for later use
        response.cookies.set('spotify_code_verifier', codeVerifier, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 10, // 10 minutes
            path: '/',
        });

        console.log('🔐 Generated PKCE verifier and redirecting to Spotify auth');
        return response;
    } catch (error) {
        console.error('Error creating authorization URL:', error);
        return NextResponse.json(
            { error: 'Failed to initiate Spotify login' },
            { status: 500 }
        );
    }
}
