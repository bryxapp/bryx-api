import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";
import { checkMaxCounts, getMaxEstimateDrafts } from "../utils/checkMaxCount";
let appInsights = require('applicationinsights');

const getEstimateDrafts = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const userId = decodedToken.sub;
    const orgId = decodedToken.org_id ? decodedToken.org_id : null;

    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber) : 1;
    const skipCount = (pageNumber - 1) * pageSize;

    // Get the database
    const container = await getDatabaseContainer("EstimateDrafts");

    let queryString = "SELECT * FROM c WHERE c.orgId = @orgId";
    if (!orgId) {
      queryString += " AND c.userId = @userId";
    }
    queryString += " ORDER BY c._ts DESC OFFSET @skipCount LIMIT @pageSize";
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
    const { resources: fetchedEstimateDrafts } = await container.items.query(querySpec).fetchAll();

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "GetAllEstimateDrafts",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_id,
        api: "Estimates"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateDraftsRetrieved",
      value: 1
    });
    const maxDraftsReached = checkMaxCounts(decodedToken.sub, decodedToken.org_id, "EstimateDrafts", getMaxEstimateDrafts);

    context.res = {
      status: 200,
      body: {
        fetchedEstimateDrafts: fetchedEstimateDrafts,
        maxDraftsReached: maxDraftsReached
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get all estimate drafts failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getEstimateDrafts;