import { Context, HttpRequest } from "@azure/functions";
import { AuthType } from "../utils/security";
import { GetOrganizationMembers } from "../utils/auth0";

let appInsights = require('applicationinsights');

const getOrganizationMembers = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const orgId = decodedToken.org_id;
    if (!orgId) {
      context.res = {
        status: 404,
        body: "Org ID not found."
      };
      return;
    }

    const members = await GetOrganizationMembers(orgId);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "getOrganizationMembers",
      properties: {
        userId: decodedToken.sub,
        api: "Organizations"
      }
    });

    // Log a custom metric
    telemetryClient.trackMetric({
      name: "OrganizationMembersRetrieved",
      value: 1
    });


    context.res = {
      status: 200,
      body: {
        members: members
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Getting Organization members Failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getOrganizationMembers;