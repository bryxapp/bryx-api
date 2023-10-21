import { getDatabaseContainer } from "../utils/database";

export const getOrgFromStripeId = async (stripeCustomerId: string) => {
    //See if stripeCustomerId is in the Organizations table
    const container = await getDatabaseContainer("Organizations");
    let querySpec = {
        query: "SELECT * FROM c WHERE c.stripeOrgId = @stripeOrgId",
        parameters: [
            {
                name: "@stripeOrgId",
                value: stripeCustomerId
            }
        ]
    };
    const { resources: orgs } = await container.items
        .query(querySpec)
        .fetchAll();
    if (orgs.length === 0) {
        return null
    }
    const org = orgs[0];
    return org;
}

export const getUserFromStripeId = async (stripeCustomerId: string) => {
    //See if stripeCustomerId is in the Users table
    const container = await getDatabaseContainer("Users");
    let querySpec = {
        query: "SELECT * FROM c WHERE c.stripeUserId = @stripeUserId",
        parameters: [
            {
                name: "@stripeUserId",
                value: stripeCustomerId
            }
        ]
    };
    const { resources: users } = await container.items
        .query(querySpec)
        .fetchAll();
    if (users.length === 0) {
        return null
    }
    const user = users[0];
    return user;
}


export const upgradeSubscription = async (stripeCustomerId: string) => {
    const org = await getOrgFromStripeId(stripeCustomerId);
    if (org) {
        //Update subscription to TEAM model if not already
        if (org.subscription === "TEAM") {
            return;
        }
        org.subscription = "TEAM";
        const container = await getDatabaseContainer("Organizations");
        await container.items.upsert(org);
    }
    else {
        const user = await getUserFromStripeId(stripeCustomerId);
        if (user) {
            //Update subscription to PRO model if not already
            if (user.subscription === "PRO") {
                return;
            }
            user.subscription = "PRO";
            const container = await getDatabaseContainer("Users");
            await container.items.upsert(user);
        }
        else {
            throw new Error("Customer not found");
        }
    }
}

export const downgradeSubscription = async (stripeCustomerId: string) => {
    const org = await getOrgFromStripeId(stripeCustomerId);
    if (org) {
        //Set Org to EXPIRED 
        const org = await getOrgFromStripeId(stripeCustomerId);
        if (org.subscription === "EXPIRED") {
            return;
        }
        org.subscription = "EXPIRED";
        const container = await getDatabaseContainer("Organizations");
        await container.items.upsert(org);
    }
    else {
        const user = await getUserFromStripeId(stripeCustomerId);
        if (user) {
            // Downgrade subscription to STARTER 
            if (user.subscription === "STARTER") {
                return;
            }
            user.subscription = "STARTER";
            const container = await getDatabaseContainer("Users");
            await container.items.upsert(user);
        }
        else {
            throw new Error("Customer not found");
        }
    }
}
