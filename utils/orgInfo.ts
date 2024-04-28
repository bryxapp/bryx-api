import { getDatabaseContainer } from "./database";
import { OrgSubscriptionNames } from "./userInfo";

export const createOrg = async (orgId: string, orgDisplayName: string, ownerUserId: string, stripeOrgId: string) => {
    const newOrg = {
        orgId: orgId,
        orgDisplayName: orgDisplayName,
        stripeOrgId: stripeOrgId,
        auth0OrgId: orgId,
        ownerUserId: ownerUserId,
        subscription: OrgSubscriptionNames.TEAM
    };
    // Get the database
    const container = await getDatabaseContainer("Organizations");

    // Create the estimate document
    const { resource: createdOrg } = await container.items.create({ ...newOrg });
    return createdOrg;
}

export const getOrgTeamName = async (orgId: string) => {
    const container = await getDatabaseContainer("Organizations");
    const querySpec = {
        query: "SELECT * FROM c WHERE c.orgId = @orgId",
        parameters: [
            {
                name: "@orgId",
                value: orgId
            }
        ]
    };

    // Get the user
    const { resources: orgs } = await container.items
        .query(querySpec)
        .fetchAll();
    if (!orgs || orgs.length === 0) {
        return null;
    }
    const org = orgs[0];
    return org.orgDisplayName;
}

export const updateOrg = async (orgId: string, newTeamName?: string, primaryColor?: string, secondaryColor?: string, logoUrl?: string) => {
    const container = await getDatabaseContainer("Organizations");
    const querySpec = {
        query: "SELECT * FROM c WHERE c.orgId = @orgId",
        parameters: [
            {
                name: "@orgId",
                value: orgId
            }
        ]
    };

    // Get the user
    const { resources: orgs } = await container.items
        .query(querySpec)
        .fetchAll();
    if (!orgs || orgs.length === 0) {
        return null;
    }
    const org = orgs[0];
    if (newTeamName) {
        org.orgDisplayName = newTeamName;
    }
    let branding = org.branding || {};
    if (primaryColor) {
        branding.primaryColor = primaryColor;
    }
    if (secondaryColor) {
        branding.secondaryColor = secondaryColor;
    }
    if (logoUrl) {
        branding.logoUrl = logoUrl;
    }
    org.branding = branding;
    await container.items.upsert(org);
    return org;
}

export const getOrgInfo = async (orgId: string) => {
    const container = await getDatabaseContainer("Organizations");
    let querySpec = {
        query: "SELECT * FROM c WHERE c.orgId = @orgId",
        parameters: [
            {
                name: "@orgId",
                value: orgId
            }
        ]
    };
    const { resources: orgs } = await container.items
        .query(querySpec)
        .fetchAll();
    if (orgs.length === 0) {
        throw new Error("Organization not found");
    }
    const org = orgs[0];
    return org;
}

