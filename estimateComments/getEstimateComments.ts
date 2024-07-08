import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { KindeTokenDecoded } from "../utils/security";

let appInsights = require('applicationinsights');

const getEstimateComments = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    if (!req.query.estimateId) {
      context.res = {
        status: 400,
        body: "Please pass a estimateId on the query string"
      };
      return;
    }

    const estimateId = req.query.estimateId;

    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 5;
    const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber) : 1;
    const skipCount = (pageNumber - 1) * pageSize;

    // Get the database
    const container = await getDatabaseContainer("EstimateComments");

    // Get estimates with paging
    const querySpec = {
      query: "SELECT * FROM c WHERE c.estimateId = @estimateId ORDER BY c._ts DESC OFFSET @skipCount LIMIT @pageSize",
      parameters: [
        {
          name: "@estimateId",
          value: estimateId
        },
        {
          name: "@skipCount",
          value: skipCount
        },
        {
          name: "@pageSize",
          value: pageSize
        }
      ]
    };

    // Fetch the estimates
    const { resources: fetchedEstimateComments } = await container.items.query(querySpec).fetchAll();

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "GetEstimateComments",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_code,
        api: "Estimates"
      }    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateCommentsRetrieved",
      value: 1
    });
    context.res = {
      status: 200,
      body: fetchedEstimateComments
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get estimate comments failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getEstimateComments;