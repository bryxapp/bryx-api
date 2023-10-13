import { getDatabaseContainer } from "./database";

export type Subscription = "" | "STARTER" | "PRO" | "TEAM" | "ENTERPRISE";

export const getUserSubscription = async (userId: string) => {
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
};

export const getOrgSubscription = async (orgId: string) => {
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
};

export const updateUserInfo = async (userId: string, stripeUserId: string, subscription: Subscription) => {
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
    user.stripeUserId = stripeUserId;
    await container.items.upsert(user);
}
export const updateOrgInfo = async (orgId: string, stripeUserId: string, subscription: Subscription) => {
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
    org.stripeUserId = stripeUserId;
    await container.items.upsert(org);
}
