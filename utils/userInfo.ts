import { getDatabaseContainer } from "./database";

export type Subscription = ""| "STARTER" | "PRO" | "TEAM" | "ENTERPRISE";

export const getSubscription = async (userId:string, orgId) => {
    if (!orgId) { // If there is no orgId, then the user is not part of an organization
        const container = await getDatabaseContainer("Users");
        const { resource: user } = await container.item(userId, undefined).read();
        return user.subscription as Subscription;    
    }
    else{ // If there is an orgId, then the user is part of an organization get the subscription from the organization
        const container = await getDatabaseContainer("Organizations");
        const { resource: org } = await container.item(orgId, undefined).read();
        return org.subscription as Subscription;
    }
};
