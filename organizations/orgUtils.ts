import { getDatabaseContainer } from "../utils/database";

export const getOrganizationById = async (orgId: string) => {
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

    // Get the org
    const { resources: orgs } = await container.items
      .query(querySpec)
      .fetchAll();
    if (!orgs || orgs.length === 0) {
      return null;
    }
    const org = orgs[0];
    return org;
}