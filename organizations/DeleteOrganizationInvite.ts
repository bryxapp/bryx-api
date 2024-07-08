import { Context, HttpRequest } from "@azure/functions";
import { KindeTokenDecoded } from "../utils/security";
import { DeleteUserInvite } from "../utils/kinde-x";

let appInsights = require('applicationinsights');

const deleteOrganizationInvite = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    const orgId = decodedToken.org_code;
    if (!orgId) {
      context.res = {
        status: 404,
        body: "Org ID not found."
      };
      return;
    }
    if(!req.body.inviteId){
      context.res = {
        status: 400,
        body: "Invite ID to delete not found."
      };
      return;
    }

    await DeleteUserInvite(req.body.inviteId, orgId);
    
    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "deleteOrganizationInvite",
      properties: {
        userId: decodedToken.sub,
        api: "Organizations"
      }
    });

    // Log a custom metric
    telemetryClient.trackMetric({
      name: "OrganizationInviteDeleted",
      value: 1
    });


    context.res = {
      status: 200,
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Deleting Organization Invite Failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default deleteOrganizationInvite;