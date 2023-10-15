import { Context, HttpRequest } from "@azure/functions";
import { AuthType } from "../utils/security";
import { GetOrganizationMembers, InviteUserToOrganization, GetOrganizationIvites } from "../utils/auth0";

let appInsights = require('applicationinsights');

const inviteUser = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const orgId = decodedToken.org_id;
    if (!orgId) {
      context.res = {
        status: 404,
        body: "Org ID not found."
      };
      return;
    }

    if (!req.body.email || !req.body.teamName) {
      context.res = {
        status: 400,
        body: "Email or teamName not found."
      };
      return;
    }

    //check if already 5 invites or current members
    const members = await GetOrganizationMembers(orgId);
    const invites = await GetOrganizationIvites(orgId);

    if (members.data.length + invites.data.length >= 5) {
      context.res = {
        status: 400,
        body: "You have reached the maximum number of invites + members."
      };
      return;
    }

    //Send Invite 
    await InviteUserToOrganization(orgId, req.body.email, req.body.teamName);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "InviteUserToOrg",
      properties: {
        userId: decodedToken.sub,
        api: "Organizations"
      }
    });

    // Log a custom metric
    telemetryClient.trackMetric({
      name: "UserInvitedToOrg",
      value: 1
    });


    context.res = {
      status: 200,
      body: {
        message: "User Invited"
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Inviting User to Org Failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default inviteUser;