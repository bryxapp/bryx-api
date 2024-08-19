import { KindeClient, GrantType } from '@kinde-oss/kinde-nodejs-sdk';
import * as dotenv from 'dotenv';

dotenv.config();

const initializeKindeClient = () => {
    return new KindeClient({
        domain: 'https://bryxbids.kinde.com',
        clientId: 'e05fa1a0bbd6461c989583c849e9ed9c',
        clientSecret: process.env.KINDE_CLIENT_SECRET,
        redirectUri: 'http://localhost:3000/callback',
        logoutRedirectUri: 'http://localhost:3000',
        grantType: GrantType.PKCE
    });
}

export const CreateKindeOrganization = async (teamName: string) => {
    const kinde = initializeKindeClient();
    const name = await GetName(teamName);
    const createdOrganization = await kinde.createOrg({ org_name: name });
    return createdOrganization.orgCode;
}

export const GetOrganization = async (req) => {
    const kinde = initializeKindeClient();
    const organization = await kinde.getOrganization(req);
    return organization;
}

export const GetOrganizationMembers = async (orgCode: string) => {
    const kinde = initializeKindeClient();
    const members = await kinde.getOrganizationMembers({ org_code: orgCode });
    return members;
}

export const InviteUserToOrganization = async (email: string, orgCode: string, teamName: string) => {
    const kinde = initializeKindeClient();
    await kinde.createInvitation({
        org_code: orgCode,
        invitee: { email: email },
        inviter: { name: teamName }
    });
}

export const GetOrganizationInvites = async (orgCode: string) => {
    const kinde = initializeKindeClient();
    const invites = await kinde.getOrganizationInvites({ org_code: orgCode });
    return invites;
}

export const DeleteUserInvite = async (inviteId: string, orgCode: string) => {
    const kinde = initializeKindeClient();
    await kinde.deleteInvitation({ org_code: orgCode, invite_id: inviteId });
}

export const RemoveUserFromOrganization = async (userId: string, orgCode: string) => {
    const kinde = initializeKindeClient();
    await kinde.removeOrganizationMember({ org_code: orgCode, user_id: userId });
}

export const UpdateOrganization = async (orgCode: string, newTeamName?: string, primaryColor?: string, logoUrl?: string) => {
    const kinde = initializeKindeClient();
    const orgUpdates = {};
    if (newTeamName) {
        orgUpdates['display_name'] = newTeamName;
        orgUpdates['name'] = await GetName(newTeamName);
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
    await kinde.updateOrganization({ org_code: orgCode }, orgUpdates);
}

const GetName = async (teamName: string) => {
    // remove whitespace
    teamName = teamName.replace(/\s/g, '');
    // remove special characters
    teamName = teamName.replace(/[^\w\s]/gi, '');
    // convert to lowercase
    teamName = teamName.toLowerCase();
    return teamName;
}