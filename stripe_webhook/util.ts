import { getDatabaseContainer } from "../utils/database";

export const isOrg = async (stripeCustomerId:string) => {
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
        return false;
    }
    return true;
} 

export const isUser = async (stripeCustomerId:string) => {
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
        return false;
    }
    return true;
}
