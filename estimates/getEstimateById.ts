import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { getOrganizationById } from "../organizations/orgUtils";

let appInsights = require('applicationinsights');

const getEstimateById = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const EstimateId = req.params.estimateId;

    // Validate the Estimate ID
    if (!EstimateId) {
      context.res = {
        status: 400,
        body: "Estimate ID is required."
      };
      return;
    }

    // Get the database
    const container = await getDatabaseContainer("Estimates");

    const { resource: estimate } = await container.item(EstimateId, undefined).read();

    if (estimate.orgId) {
      const org = await getOrganizationById(estimate.orgId);
      if (org) {
        estimate.orgDisplayName = org.displayName;
        estimate.branding = org.branding;
      }
    }

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "GetEstimateById",
      properties: {
        api: "Estimates"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateRetrieved",
      value: 1
    });

    if (!estimate) {
      context.res = {
        status: 404,
        body: "Estimate not found."
      };
      return;
    }

    context.res = {
      status: 200,
      body: estimate
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get estimate by id failed"), properties: { api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getEstimateById;