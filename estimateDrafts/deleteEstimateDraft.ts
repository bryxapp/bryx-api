import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";

let appInsights = require('applicationinsights');

const deleteEstimateDraft = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const estimateDraftId = req.params.estimateDraftId;

    // Validate the estimate ID
    if (!estimateDraftId) {
      context.res = {
        status: 400,
        body: "Estimate ID is required."
      };
      return;
    }

    //Get the database connection
    const container = await getDatabaseContainer("EstimateDrafts");

    //Delete the estimate from Cosmos DB
    await container.item(estimateDraftId, undefined).delete();

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "DeleteEstimateDraftById",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_id,
        api: "Estimates"
      }    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateDraftDeleted",
      value: 1
    });

    context.res = {
      status: 200,
      body: "Estimate draft deleted successfully."
    };

  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Delete estimate draft by id failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default deleteEstimateDraft;