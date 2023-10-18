import { Context, HttpRequest } from "@azure/functions";
import { AuthType } from "../utils/security";
import { RenameOrganization } from "../utils/auth0";
import { renameOrg } from "../utils/orgInfo";

let appInsights = require('applicationinsights');

const renameOrganization = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const orgId = decodedToken.org_id;
    if (!orgId) {
      context.res = {
        status: 404,
        body: "Org ID not found."
      };
      return;
    }

    if (!req.body.newTeamName) {
      context.res = {
        status: 400,
        body: "New Team Name not found."
      };
      return;
    }

    //Update Auth0 Org Name
    await RenameOrganization(orgId, req.body.newTeamName);

    //Update Bryx DB Org Name
    await renameOrg(orgId, req.body.newTeamName);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "RenameOrg",
      properties: {
        userId: decodedToken.sub,
        api: "Organizations"
      }
    });

    // Log a custom metric
    telemetryClient.trackMetric({
      name: "OrgRenamed",
      value: 1
    });


    context.res = {
      status: 200,
      body: {
        message: "Org Renames",
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

export default renameOrganization;