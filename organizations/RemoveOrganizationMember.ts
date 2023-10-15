import { Context, HttpRequest } from "@azure/functions";
import { AuthType } from "../utils/security";
import { GetOrganizationMembers, RemoveUserFromOrganization } from "../utils/auth0";

let appInsights = require('applicationinsights');

const removeOrganizationMember = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const orgId = decodedToken.org_id;
    if (!orgId) {
      context.res = {
        status: 404,
        body: "Org ID not found."
      };
      return;
    }
    if(!req.body.memberId){
      context.res = {
        status: 400,
        body: "Member ID to remove not found."
      };
      return;
    }

    await RemoveUserFromOrganization(req.body.memberId, orgId);
    
    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "removeOrganizationMember",
      properties: {
        userId: decodedToken.sub,
        api: "Organizations"
      }
    });

    // Log a custom metric
    telemetryClient.trackMetric({
      name: "OrganizationMemberRemoved",
      value: 1
    });


    context.res = {
      status: 200,
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Removing Organization Member Failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default removeOrganizationMember;