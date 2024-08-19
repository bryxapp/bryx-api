import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const fetchAccessToken = async () => {
    try {
        const tokenResponse = await axios.post('https://bryxbids.kinde.com/oauth2/token', new URLSearchParams({
            audience: 'https://bryxbids.kinde.com/api',
            grant_type: 'client_credentials',
            client_id: '68f0230f8255449baf919e41f2edd031',
            client_secret: process.env.KINDE_CLIENT_SECRET,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        return tokenResponse.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error);
        throw error;
    }
}

const kindeClient = axios.create({
    baseURL: 'https://bryxbids.kinde.com',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

export const createKindeOrganization = async (teamName) => {
    try {
        const accessToken = await fetchAccessToken();
        const response = await kindeClient.post('/api/v1/organizations', { name: teamName }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data.organization.code;
    } catch (error) {
        console.error('Error creating organization:', error);
        throw error;
    }
}

export const getOrganization = async (orgCode) => {
    try {
        const accessToken = await fetchAccessToken();
        const response = await kindeClient.get(`/api/v1/organizations/${orgCode}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting organization:', error);
        throw error;
    }
}

export const getOrganizationMembers = async (orgCode) => {
    try {
        const accessToken = await fetchAccessToken();
        const response = await kindeClient.get(`/api/v1/organizations/${orgCode}/users`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error getting organization members:', error);
        throw error;
    }
}

export const AddUserToOrganization = async (userId: string, orgCode: string) => {
    try {
        const accessToken = await fetchAccessToken();
        await kindeClient.post(`/api/v1/organizations/${orgCode}/users`, { id: userId }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
    } catch (error) {
        console.error('Error adding user to organization:', error);
        throw error;
    }
}

export const InviteUserToOrganization = async (email: string, orgId: string, teamName: string) => {