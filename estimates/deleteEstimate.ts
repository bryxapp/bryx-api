import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { deletePdf } from "../utils/blobstorage";
import { AuthType } from "../utils/Types/authType";
let appInsights = require('applicationinsights');

const deleteEstimate = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const estimateId = req.params.estimateId;

    // Validate the estimate ID
    if (!estimateId) {
      context.res = {
        status: 400,
        body: "Estimate ID is required."
      };
      return;
    }

    //Get the database connection
    const container = await getDatabaseContainer("Estimates");

    //Fetch the estimate
    const { resource: estimate } = await container.item(estimateId, undefined).read();

    //Delete the estimate pdf from blob storage
    await deletePdf(estimate.estimatePdfUrl);

    //Delete the estimate from Cosmos DB
    await container.item(estimateId, undefined).delete();

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "DeleteEstimateById",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_id,
        api: "Estimates"
      }    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateDeleted",
      value: 1
    });

    context.res = {
      status: 200,
      body: "Estimate deleted successfully."
    };

  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Delete estimate by id failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default deleteEstimate;