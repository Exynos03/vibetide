import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/spotify-client';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('🔵 Callback received:', {
        code: code?.substring(0, 20) + '...',
        error,
        hasVerifier: !!request.cookies.get('spotify_code_verifier')
    });

    if (error) {
        console.error('❌ Spotify returned error:', error);
        return NextResponse.redirect(
            new URL(`/?error=${error}`, request.url)
        );
    }

    if (!code) {
        console.error('❌ No code in callback');
        return NextResponse.redirect(
            new URL('/?error=no_code', request.url)
        );
    }

    // Get code verifier from cookie
    const codeVerifier = request.cookies.get('spotify_code_verifier')?.value;

    if (!codeVerifier) {
        console.error('❌ No code verifier found in cookies');
        return NextResponse.redirect(
            new URL('/?error=no_verifier', request.url)
        );
    }

    try {
        console.log('🔄 Exchanging code for token with PKCE...');
        const { accessToken, refreshToken, expiresIn } = await exchangeCodeForToken(code, codeVerifier);

        console.log('✅ Token exchange successful:', {
            accessTokenLength: accessToken.length,
            refreshTokenLength: refreshToken.length,
            expiresIn
        });

        // Create response and set cookies
        const response = NextResponse.redirect(new URL('/', request.url));

        // Clear the code verifier cookie
        response.cookies.delete('spotify_code_verifier');

        // Set access token cookie (expires in 1 hour typically)
        response.cookies.set('spotify_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: expiresIn,
            path: '/',
        });

        // Set refresh token cookie (long-lived)
        response.cookies.set('spotify_refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });

        console.log('✅ Cookies set, redirecting to home');
        return response;
    } catch (error: any) {
        console.error('❌ Error exchanging code for token:', {
            message: error.message,
        });
        return NextResponse.redirect(
            new URL('/?error=token_exchange_failed', request.url)
        );
    }
}
