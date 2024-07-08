import { Context, HttpRequest } from "@azure/functions";
import { KindeTokenDecoded } from "../utils/security";
import { GetOrganizationIvites, GetOrganizationMembers } from "../utils/kinde-x";

let appInsights = require('applicationinsights');

const getOrganizationMembers = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    const orgId = decodedToken.org_code;
    if (!orgId) {
      context.res = {
        status: 404,
        body: "Org ID not found."
      };
      return;
    }

    const members = await GetOrganizationMembers(orgId);
    const invites = await GetOrganizationIvites(orgId);

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
        members: members,
        invites: invites
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Getting Organization members Failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getOrganizationMembers;