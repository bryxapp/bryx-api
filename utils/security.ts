import { get } from 'http';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

///Create an interface type for authentication object
export interface AuthType {
    sub: string;
    org_id?: string;
}


export const verifyAuth0Token = (tokenString: string) => {
    try {

        const [tokenScheme, tokenValue] = tokenString.split(' ');

        if (!tokenScheme || tokenScheme !== 'Bearer' || !tokenValue) {
            return null;
        }

        const key = process.env.AUTH0_PUBLIC_KEY.replace(/\\n/g, '\n');
        const decodedToken = jwt.verify(tokenValue, key);

        return decodedToken as AuthType;

    } catch (error) {
        console.error('Token verification failed:', error);

        throw error;
    }
};

export interface KindeTokenDecoded {
    sub: string;  // Subject (usually the user ID)
    iss: string;  // Issuer
    aud: string;  // Audience
    exp: number;  // Expiration time (Unix timestamp)
    iat: number;  // Issued at time (Unix timestamp)
    [key: string]: any;  // Additional claims can be added as needed
}

const client = jwksClient({
    jwksUri: 'https://bryxbids.kinde.com/.well-known/jwks'
});

function getKey(header): Promise<string> {
    return new Promise((resolve, reject) => {
        client.getSigningKey(header.kid, (err, key) => {
            if (err) {
                reject(err);
            } else {
                const signingKey = key.getPublicKey();
                resolve(signingKey);
            }
        });
    });
}

export const verifyKindeToken = async (tokenString: string): Promise<KindeTokenDecoded> => {
    const [tokenScheme, tokenValue] = tokenString.split(' ');

    if (!tokenScheme || tokenScheme !== 'Bearer' || !tokenValue) {
        throw new Error('Invalid token scheme or value');
    }

    try {
        const decodedToken = await new Promise<KindeTokenDecoded>((resolve, reject) => {
            jwt.verify(tokenValue, async (header, callback) => {
                try {
                    const key = await getKey(header);
                    callback(null, key);
                } catch (error) {
                    callback(error);
                }
            }, (err, decoded) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded as KindeTokenDecoded);
                }
            });
        });

        return decodedToken;
    } catch (error) {
        console.error('Token verification failed:', error);
        throw error;
    }
};
