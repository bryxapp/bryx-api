import { ManagementClient } from 'auth0';

// Initialize the Auth0 client with the required credentials
const initializeAuth0Client = () => {
    return new ManagementClient({
        domain: 'dev-eqbwfxwsxyrgrg2y.us.auth0.com',
        clientId: 'dyIwPx03tlWNOtB0d5pShhznlJ356Md3',
        clientSecret: process.env.AUTH0_CLIENT_SECRET,
    });
}

// Create a new Auth0 organization
export const createAuth0Organization = async (teamName: string) => {
    const auth0 = initializeAuth0Client();
    const name = await getName(teamName);
    const createdOrganization = await auth0.organizations.create({
        name: name,
        display_name: teamName,
        enabled_connections: [
            {
                connection_id: 'con_cxCgkywfjCeEZ5vO' // Username-Password-Authentication
            },
            {
                connection_id: 'con_dnoGDuaZv0HlQog2' // Google-OAuth2
            }
        ]
    });
    return createdOrganization.data.id;
}

// Retrieve an Auth0 organization by ID
export const getOrganization = async (orgId: string) => {
    const auth0 = initializeAuth0Client();
    const organization = await auth0.organizations.get({
        id: orgId,
    });
    return organization.data;
}

// Add a user to an Auth0 organization
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

// Get members of an Auth0 organization
export const GetOrganizationMembers = async (orgId: string) => {
    const auth0 = initializeAuth0Client();
    const members = await auth0.organizations.getMembers({
        id: orgId,
    });
    return members;
}

// Invite a user to an Auth0 organization
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

// Get invitations for an Auth0 organization
export const GetOrganizationIvites = async (orgId: string) => {
    const auth0 = initializeAuth0Client();
    const invites = await auth0.organizations.getInvitations({
        id: orgId,
    });
    return invites;
}

// Delete a user invitation from an Auth0 organization
export const DeleteUserInvite = async (inviteId: string, orgId: string) => {
    const auth0 = initializeAuth0Client();
    await auth0.organizations.deleteInvitation({
        id: orgId,
        invitation_id: inviteId
    });
}

// Remove a user from an Auth0 organization
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

// Update details of an Auth0 organization
export const UpdateOrganization = async (orgId: string, newTeamName?: string, primaryColor?: string, logoUrl?: string) => {
    const auth0 = initializeAuth0Client();
    const orgUpdates = {};
    if (newTeamName) {
        orgUpdates['display_name'] = newTeamName;
        orgUpdates['name'] = await getName(newTeamName);
    }
    if (primaryColor) {
        orgUpdates['branding'] = {
            colors: {
                primary: primaryColor
            }
        }
    }
    if (logoUrl) {
        orgUpdates['branding'] = {
            logo_url: logoUrl
        }
    }
    await auth0.organizations.update({
        id: orgId,
    },
        orgUpdates
    );
}

// Helper function to format the team name by removing whitespace, special characters, and converting to lowercase
const getName = async (teamName: string) => {
    teamName = teamName.replace(/\s/g, ''); // Remove whitespace
    teamName = teamName.replace(/[^\w\s]/gi, ''); // Remove special characters
    teamName = teamName.toLowerCase(); // Convert to lowercase
    return teamName;
}

// Get organizations associated with a user
export const GetOrganizationsForUser = async (userId: string) => {
    const auth0 = initializeAuth0Client();
    const organizations = await auth0.users.getUserOrganizations({
        id: userId,
    });
    return organizations;
}