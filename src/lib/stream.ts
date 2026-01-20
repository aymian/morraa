import { StreamVideoClient, User } from "@stream-io/video-react-sdk";
import { StreamChat } from "stream-chat";

const apiKey = "z5vrjj368fax";
// In a real app, the secret should only be on the backend.
// We're using it here for the dev/demo environment as requested.
const apiSecret = "bemz35yzmdqj5nwdjckny6z75h4xxfsq2gw2krrcxwfpx5ygbwuyun6m9qu6xtfn";

/**
 * JWT GENERATOR (DEV ONLY)
 * Signs a JWT for Stream Video authentication using the subtle crypto API.
 */
async function signJWT(userId: string, secret: string) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        user_id: userId,
        iat: now - 60,
        exp: now + (24 * 60 * 60) // Valid for 24 hours
    };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const strToSign = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const data = encoder.encode(strToSign);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureString = signatureArray.map(byte => String.fromCharCode(byte)).join('');
    const encodedSignature = btoa(signatureString)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${strToSign}.${encodedSignature}`;
}

export const generateStreamToken = async (userId: string) => {
    return signJWT(userId, apiSecret);
};

export const getStreamClient = async (user: User) => {
    const token = await generateStreamToken(user.id);
    return new StreamVideoClient({ apiKey, user, token });
};

export { apiKey };
