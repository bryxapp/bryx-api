import { getDatabaseContainer } from "./database";

export type UserSubscription = "" | "STARTER" | "PRO"
export type OrgSubscription = "" | "TEAM" | "EXPIRED"

export enum UserSubscriptionNames {
    STARTER = "STARTER",
    PRO = "PRO",
}

export enum OrgSubscriptionNames {
    TEAM = "TEAM",
    EXPIRED = "EXPIRED"
}

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
    return user.subscription as UserSubscription;
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
    return org.subscription as OrgSubscription;
};

export const setUserSubscriptionPro = async (userId: string, stripeUserId: string) => {
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
    user.subscription = UserSubscriptionNames.PRO;
    user.stripeUserId = stripeUserId;
    await container.items.upsert(user);
}

export const clearUserSubscription = async (userId: string) => {
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
    user.subscription = UserSubscriptionNames.STARTER;
    await container.items.upsert(user);
}

export const clearOrgSubscription = async (orgId: string) => {
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
    org.subscription = OrgSubscriptionNames.EXPIRED;
    await container.items.upsert(org);
}