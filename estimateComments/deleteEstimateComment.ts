import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";

let appInsights = require('applicationinsights');

const deleteEstimateComment = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const estimateCommentId = req.params.estimateCommentId;

    // Validate the estimate ID
    if (!estimateCommentId) {
      context.res = {
        status: 400,
        body: "Estimate Comment ID is required."
      };
      return;
    }

    //Get the database connection
    const container = await getDatabaseContainer("EstimateComments");

    //Delete the estimate from Cosmos DB
    await container.item(estimateCommentId, undefined).delete();

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "DeleteEstimateCommentById",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_id,
        api: "Estimates"
      }    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateCommentDeleted",
      value: 1
    });

    context.res = {
      status: 200,
      body: "Estimate comment deleted successfully."
    };

  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Delete estimate comment by id failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default deleteEstimateComment;