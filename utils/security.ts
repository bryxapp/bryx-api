import * as jwt from 'jsonwebtoken';
import { AuthType } from './Types/authType';

export const verifyToken = (tokenString: string) => {
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
