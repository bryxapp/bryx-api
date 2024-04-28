import { Context, HttpRequest } from "@azure/functions";
import { AuthType } from "../utils/security";
import { UpdateOrganization } from "../utils/auth0";
import { updateOrg } from "../utils/orgInfo";

let appInsights = require('applicationinsights');

const updateOrganization = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const orgId = decodedToken.org_id;
    if (!orgId) {
      context.res = {
        status: 404,
        body: "Org ID not found."
      };
      return;
    }

    if (!req.body.newTeamName || !req.body.primaryColor || !req.body.secondaryColor || !req.body.logoUrl) {
      context.res = {
        status: 400,
        body: "Please pass a valid newTeamName, primaryColor, secondaryColor, or logoUrl in the request body"
      };
      return;
    }

    //Update Auth0 Org Name
    await UpdateOrganization(orgId, req.body.newTeamName, req.body.primaryColor, req.body.secondaryColor, req.body.logoUrl);

    //Update Bryx DB Org Name
    await updateOrg(orgId, req.body.newTeamName);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "UpdateOrg",
      properties: {
        userId: decodedToken.sub,
        api: "Organizations"
      }
    });

    // Log a custom metric
    telemetryClient.trackMetric({
      name: "OrgUpdated",
      value: 1
    });


    context.res = {
      status: 200,
      body: {
        message: "Org Updates",
        teamName: req.body.newTeamName
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Renaming Org Failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default updateOrganization;