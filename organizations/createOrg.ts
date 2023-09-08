import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
let appInsights = require('applicationinsights');


const createOrg = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    // Validate there is a body and the body contains fields user,templateId,estimateName, and estimateImgObj
    if (!req.body || !req.body.org || !req.body.org.org_id) {
      context.res = {
        status: 400,
        body: "Please pass a valid org object in the request body"
      };
      return;
    }
    const newOrg = {
      orgId: req.body.org.org_id,
      auth0OrgId: req.body.org.org_id,
      subscription: "",
      stripeOrgId: "",
    }

    // Get the database
    const container = await getDatabaseContainer("Organizations");

    // Create the estimate document
    const { resource: createdOrg } = await container.items.create({ ...newOrg });

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "CreateOrg",
      properties: {
        userId: newOrg.orgId,
        api: "Organizations"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "OrgCreated",
      value: 1
    });

    // Return the created user
    context.res = {
      status: 201,
      body: {
        "msg": "Org created successfully.",
        "userId": createdOrg.orgId,
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Create org failed"), properties: { body: req.body, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createOrg;