import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { KindeTokenDecoded } from "../utils/security";

let appInsights = require('applicationinsights');

const getEstimateDraftById = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    const estimateDraftId = req.params.estimateDraftId;

    // Validate the Estimate ID
    if (!estimateDraftId) {
      context.res = {
        status: 400,
        body: "Estimate Draft ID is required."
      };
      return;
    }

    // Get the database
    const container = await getDatabaseContainer("EstimateDrafts");

    const { resource: estimateDraft } = await container.item(estimateDraftId, undefined).read();

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "GetEstimateDraftById",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_code,
        api: "Estimates"
      }    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateDraftIdRetrieved",
      value: 1
    });

    if (!estimateDraft) {
      context.res = {
        status: 404,
        body: "Estimate Draft not found."
      };
      return;
    }

    context.res = {
      status: 200,
      body: estimateDraft
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get estimate draft by id failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getEstimateDraftById;