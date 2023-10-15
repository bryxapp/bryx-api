import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
let appInsights = require('applicationinsights');

const updateOrg = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const orgId = req.params.orgId;
    const updatedOrgData = req.body.org;
    if (!orgId) {
      context.res = {
        status: 400,
        body: "Org ID is required."
      };
      return;
    }

    if (!updatedOrgData || updatedOrgData.orgId != orgId || !updatedOrgData.auth0OrgId || !updatedOrgData.stripeOrgId) {
      context.res = {
        status: 400,
        body: "Org data is invalid. It must contain orgid, auth0UserId, subscription, and stripeUserId."
      };
      return;
    }


    // Get the template from the database
    const container = await getDatabaseContainer("Organizations");

    const org = await container.item(orgId).read();

    if (!org) {
      context.res = {
        status: 404,
        body: "org not found."
      };
      return;
    }

    // Update the template in the database
    const { resource: updatedOrg } = await container.item(orgId).replace(updatedOrgData);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "UpdateOrg",
      properties: { orgId: orgId, api: "Organizations", }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "OrgUpdated",
      value: 1
    });

    context.res = {
      status: 200,
      body: {
        "msg": "Org updated successfully.",
        "org": updatedOrg
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Org update failed"), properties: { orgId: req.params.orgId, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default updateOrg;

