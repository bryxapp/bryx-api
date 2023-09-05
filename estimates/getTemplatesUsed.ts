import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/Types/authType";
let appInsights = require('applicationinsights');

const getTemplatesUsed = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const userId = decodedToken.sub;
    const orgId = decodedToken.org_id ? decodedToken.org_id : null;

    // Get the database
    const container = await getDatabaseContainer("Estimates");

    // Build query string
    let queryString = "SELECT DISTINCT c.templateId, c.templateFriendlyName FROM c WHERE c.orgId = @orgId";
    if (!orgId) {
      queryString += " AND c.userId = @userId";
    }
    queryString += " ORDER BY c._ts DESC";

    // Get estimates with paging
    const querySpec = {
      query: queryString,
      parameters: [
        {
          name: "@orgId",
          value: orgId
        },
        {
          name: "@userId",
          value: userId
        }
      ]
    };

    // Fetch the estimates
    const { resources: fetchedEstimates } = await container.items.query(querySpec).fetchAll();

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "GetTemplatesUsed",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_id,
        api: "Estimates"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "TemplatesUsedRetrieved",
      value: 1
    });

    context.res = {
      status: 200,
      body: fetchedEstimates
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get templates used failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getTemplatesUsed;
