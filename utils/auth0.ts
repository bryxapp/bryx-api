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

export const getOrganization = async (orgId: string) => {
    const organization = await auth0.organizations.get({
        id: orgId,
    });
    return organization;
}

export const AddUserToOrganization = async (userId: string, orgId: string) => {
    await auth0.organizations.addMembers({
        id: orgId,
    },
        {
            members: [userId]
        }
    );
}

export const GetOrganizationMembers = async (orgId: string) => {
    const members = await auth0.organizations.getMembers({
        id: orgId,
    });
    return members;
}

export const InviteUserToOrganization = async (email: string, orgId: string, teamName: string) => {
    await auth0.organizations.createInvitation({
        id: orgId,
    },
        {
            invitee: {
                email: email
            },
            inviter: {
                name: teamName
            },
            client_id: 'WXOgQUbq0W5JRnG8nJaW3O0lcBhSPqO9'
        }
    );
}

//TODO Get Invites / Cancel Invites

//Remove User from Organization



