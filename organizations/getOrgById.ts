import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";
import { getOrganization } from "../utils/auth0";

let appInsights = require('applicationinsights');

const getOrgById = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const orgId = decodedToken.org_id;
    if (!orgId) {
      context.res = {
        status: 404,
        body: "Org not found."
      };
      return;
    }
    // Get the database
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
      context.res = {
        status: 404,
        body: "Org not found."
      };
      return;
    }
    const org = orgs[0];

    //Get Auth0 Org
    const auth0Org = await getOrganization(orgId);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "GetOrgById",
      properties: {
        userId: decodedToken.sub,
        api: "Organizations"
      }
    });

    // Log a custom metric
    telemetryClient.trackMetric({
      name: "OrgRetrieved",
      value: 1
    });

    if (!org) {
      context.res = {
        status: 404,
        body: "Org not found."
      };
      return;
    }

    context.res = {
      status: 200,
      body: {
        bryxOrg: org,
        auth0Org: auth0Org
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get org by id failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getOrgById;