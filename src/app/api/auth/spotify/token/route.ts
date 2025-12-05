import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/spotify-client';

export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get('spotify_access_token')?.value;
    const refreshToken = request.cookies.get('spotify_refresh_token')?.value;

    console.log('🔍 Token Route Check:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        cookieNames: request.cookies.getAll().map(c => c.name),
        accessTokenLength: accessToken?.length,
    });

    // If we have a valid access token, return it
    if (accessToken) {
        return NextResponse.json({ accessToken });
    }

    // If we have a refresh token, try to get a new access token
    if (refreshToken) {
        try {
            console.log('🔄 Refreshing expired access token...');
            const { accessToken: newAccessToken, expiresIn } = await refreshAccessToken(refreshToken);

            const response = NextResponse.json({ accessToken: newAccessToken });

            // Update the access token cookie
            response.cookies.set('spotify_access_token', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: expiresIn,
                path: '/',
            });

            return response;
        } catch (error) {
            console.error('Error refreshing token:', error);
            return NextResponse.json(
                { error: 'Failed to refresh token' },
                { status: 401 }
            );
        }
    }

    // No tokens available
    console.log('❌ No tokens found in request cookies');
    return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
    );
}

// Logout endpoint
export async function DELETE(request: NextRequest) {
    const response = NextResponse.json({ success: true });

    // Clear cookies
    response.cookies.delete('spotify_access_token');
    response.cookies.delete('spotify_refresh_token');

    return response;
}
