import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";

let appInsights = require('applicationinsights');

const getOrgById = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const orgId = decodedToken.org_id;
    // Get the database
    const container = await getDatabaseContainer("Organizations");

    const { resource: org } = await container.item(orgId, undefined).read();

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
      body: org
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