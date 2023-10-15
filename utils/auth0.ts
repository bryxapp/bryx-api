import { ManagementClient } from 'auth0';
import { getDatabaseContainer } from './database';

const auth0 = new ManagementClient({
    domain: 'dev-eqbwfxwsxyrgrg2y.us.auth0.com',
    clientId: 'WXOgQUbq0W5JRnG8nJaW3O0lcBhSPqO9',
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

export const createAuth0Organization = async (teamName: string) => {
    const createdOrganization = await auth0.organizations.create({
        name: teamName,
        
    });
    return createdOrganization.data.id;
}

export const AddUserToOrganization = async (userId: string, orgId: string) => {
    await auth0.organizations.addMembers({
        id: orgId,},
        {
            members: [userId]
        }
    );
}
