import { getDatabaseContainer } from "./database";

export type Subscription = "" | "STARTER" | "PRO" | "TEAM" | "ENTERPRISE";

export const getSubscription = async (userId: string, orgId) => {
    if (!orgId) { // If there is no orgId, then the user is not part of an organization
        const container = await getDatabaseContainer("Users");
        let querySpec = {
            query: "SELECT * FROM c WHERE c.userId = @userId",
            parameters: [
                {
                    name: "@userId",
                    value: userId
                }
            ]
        };
        const { resources: users } = await container.items
            .query(querySpec)
            .fetchAll();
        if (users.length === 0) {
            throw new Error("User not found");
        }
        const user = users[0];
        return user.subscription as Subscription;
    }
    else { // If there is an orgId, then the user is part of an organization get the subscription from the organization
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
        return org.subscription as Subscription;
    }
};

export const updateSubscription = async (userId: string, orgId:string, subscription: Subscription) => {
    if (!orgId) { // If there is no orgId, then the user is not part of an organization
        const container = await getDatabaseContainer("Users");
        let querySpec = {
            query: "SELECT * FROM c WHERE c.userId = @userId",
            parameters: [
                {
                    name: "@userId",
                    value: userId
                }
            ]
        };
        const { resources: users } = await container.items
            .query(querySpec)
            .fetchAll();
        if (users.length === 0) {
            throw new Error("User not found");
        }
        const user = users[0];
        user.subscription = subscription;
        await container.items.upsert(user);
    }
    else { // If there is an orgId, then the user is part of an organization get the subscription from the organization
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
        org.subscription = subscription;
        await container.items.upsert(org);
    }
}
