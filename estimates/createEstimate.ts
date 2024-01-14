import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";

import { checkMaxCounts, getMaxEstimates } from "../utils/checkMaxCount";
let appInsights = require('applicationinsights');


const createEstimate = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {

    if (await checkMaxCounts(decodedToken.sub, decodedToken.org_id, "Estimates", getMaxEstimates)) {
      context.res = {
        status: 400,
        body: "You have reached the maximum number of estimates for your subscription. Please upgrade your subscription to create more estimates."
      };
      appInsights.defaultClient.trackException({
        exception: new Error("Max Estimates Reached"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Estimates" }
      });

      return;
    }

    const newEstimate = req.body;
    // Validate there is a body and the body contains fields user,templateId,estimateName, and estimateImgObj
    if (!newEstimate || !newEstimate.templateId || !newEstimate.estimateName || !newEstimate.estimateCanvas) {
      context.res = {
        status: 400,
        body: "Please pass a valid estimate object in the request body"
      };
      return;
    }

    newEstimate.userId = decodedToken.sub;
    newEstimate.orgId = decodedToken.org_id ? decodedToken.org_id : null;
    newEstimate.status = "active";

    // Get the database
    const container = await getDatabaseContainer("Estimates");

    // Create the estimate document
    const { resource: createdEstimate } = await container.items.create({ ...newEstimate });

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "CreateEstimate",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_id,
        api: "Estimates"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateCreated",
      value: 1
    });

    // Return the estimate document
    context.res = {
      status: 201,
      body: {
        "msg": "Estimate created successfully.",
        "id": createdEstimate.id,
        "estimatePdfUrl": createdEstimate.estimatePdfUrl
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Create estimate failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createEstimate;