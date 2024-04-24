import { ManagementClient } from 'auth0';

const initializeAuth0Client = () => {
    return new ManagementClient({
        domain: 'dev-eqbwfxwsxyrgrg2y.us.auth0.com',
        clientId: 'dyIwPx03tlWNOtB0d5pShhznlJ356Md3',
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
    });
}

export const createAuth0Organization = async (teamName: string) => {
    const auth0 = initializeAuth0Client();
    const name = await getName(teamName);
    const createdOrganization = await auth0.organizations.create({
        name: name,
        display_name: teamName,
        enabled_connections: [
            {
                connection_id: 'con_cxCgkywfjCeEZ5vO' //Username-Password-Authentication
            },
            {
                connection_id: 'con_dnoGDuaZv0HlQog2' //Google-OAuth2
            }
        ]
    });
    return createdOrganization.data.id;
}

export const getOrganization = async (orgId: string) => {
    const auth0 = initializeAuth0Client();
    const organization = await auth0.organizations.get({
        id: orgId,
    });
    return organization.data;
}

export const AddUserToOrganization = async (userId: string, orgId: string) => {
    const auth0 = initializeAuth0Client();
    await auth0.organizations.addMembers({
        id: orgId,
    },
        {
            members: [userId]
        }
    );
}

export const GetOrganizationMembers = async (orgId: string) => {
    const auth0 = initializeAuth0Client();
    const members = await auth0.organizations.getMembers({
        id: orgId,
    });
    return members;
}

export const InviteUserToOrganization = async (email: string, orgId: string, teamName: string) => {
    const auth0 = initializeAuth0Client();
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

export const GetOrganizationIvites = async (orgId: string) => {
    const auth0 = initializeAuth0Client();
    const invites = await auth0.organizations.getInvitations({
        id: orgId,
    });
    return invites;
}

export const DeleteUserInvite = async (inviteId: string, orgId: string) => {
    const auth0 = initializeAuth0Client();
    await auth0.organizations.deleteInvitation({
        id: orgId,
        invitation_id: inviteId
    });
}

export const RemoveUserFromOrganization = async (userId: string, orgId: string) => {
    const auth0 = initializeAuth0Client();
    await auth0.organizations.deleteMembers({
        id: orgId,
    },
        {
            members: [userId]
        }
    );
}

export const RenameOrganization = async (orgId: string, newTeamName: string) => {
    const auth0 = initializeAuth0Client();
    const name = await getName(newTeamName);
    await auth0.organizations.update({
        id: orgId,
    },
        {
            name: name,
            display_name: newTeamName
        }
    );
}


const getName = async (teamName: string) => {
    //remove whitespace
    teamName = teamName.replace(/\s/g, '');
    //remove special characters
    teamName = teamName.replace(/[^\w\s]/gi, '');
    //convert to lowercase
    teamName = teamName.toLowerCase();
    return teamName;
}


export const GetOrganizationsForUser = async (userId: string) => {
    const auth0 = initializeAuth0Client();
    const organizations = await auth0.users.getUserOrganizations({
        id: userId,
    });
    return organizations;
}

