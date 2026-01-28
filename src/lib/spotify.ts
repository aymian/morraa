
const CLIENT_ID = '7aca6e69e2e34b2b84f6e37ae444f366';
const CLIENT_SECRET = 'a98eaf109a9d46ec8f57c559ff79cc0b';

// App-level token (Client Credentials Flow)
export const getAppAccessToken = async () => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials'
        })
    });

    if (!response.ok) {
        throw new Error('Failed to get app access token');
    }

    const data = await response.json();
    localStorage.setItem("spotify_app_token", data.access_token);
    localStorage.setItem("spotify_app_token_expiry", (Date.now() + data.expires_in * 1000).toString());
    return data.access_token;
};

export const getValidAppToken = async () => {
    const token = localStorage.getItem("spotify_app_token");
    const expiry = localStorage.getItem("spotify_app_token_expiry");

    if (token && expiry && Date.now() < parseInt(expiry)) {
        return token;
    }

    return await getAppAccessToken();
};

export const searchTracks = async (query: string) => {
    const token = await getValidAppToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to search tracks');
    }

    return response.json();
};

export const getNewReleases = async () => {
    const token = await getValidAppToken();
    const response = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch new releases');
    }

    return response.json();
};

export const getTrackDetails = async (trackId: string) => {
    const token = await getValidAppToken();
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch track details');
    }

    return response.json();
};

export const getFallbackPreview = async (trackName: string, artistName: string) => {
    try {
        const query = `${trackName} ${artistName}`;
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`);
        if (!response.ok) return null;
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            return data.results[0].previewUrl;
        }
    } catch (err) {
        console.error("iTunes fallback error:", err);
    }
    return null;
};
