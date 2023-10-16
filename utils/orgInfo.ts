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