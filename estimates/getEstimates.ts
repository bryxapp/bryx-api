import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { KindeTokenDecoded } from "../utils/security";
import { checkMaxCounts, getMaxEstimates } from "../utils/checkMaxCount";
let appInsights = require('applicationinsights');

const getEstimates = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    const userId = decodedToken.sub;
    const orgId = decodedToken.org_code ? decodedToken.org_code : null;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber) : 1;
    const skipCount = (pageNumber - 1) * pageSize;
    const searchTerm = req.query.searchTerm ? req.query.searchTerm : '';
    const templateId = req.query.templateId ? req.query.templateId : '';
    const startDate = req.query.startDate ?  new Date(req.query.startDate).toISOString() : '';
    const endDate = req.query.endDate ? new Date(req.query.endDate).toISOString() : '';

    // Get the database
    const container = await getDatabaseContainer("Estimates");

    // Build query string
    let queryString = "SELECT * FROM c WHERE c.orgId = @orgId AND c.status = 'active'";
    if (!orgId) {
      queryString += " AND c.userId = @userId";
    }
    if (searchTerm !== '') {
      queryString += " AND CONTAINS(c.estimateName, @searchTerm)";
    }
    if (templateId !== '') {
      queryString += " AND c.templateId = @templateId";
    }
    if (startDate && endDate) {
      queryString += " AND c.createdDate >= @startDate AND c.createdDate <= @endDate";
    }
    queryString += " ORDER BY c._ts DESC OFFSET @skipCount LIMIT @pageSize";

    // Get estimates with paging
    const querySpec = {
      query: queryString,
      parameters: [
        { name: "@orgId", value: orgId },
        { name: "@userId", value: userId },
        { name: "@skipCount", value: skipCount },
        { name: "@pageSize", value: pageSize },
        { name: "@searchTerm", value: searchTerm },
        { name: "@templateId", value: templateId },
        { name: "@startDate", value: startDate },
        { name: "@endDate", value: endDate }
      ]
    };

    console.log(querySpec);

    // Fetch the estimates
    const { resources: fetchedEstimates } = await container.items.query(querySpec).fetchAll();
    const maxEstimatesReached = await checkMaxCounts(decodedToken.sub, decodedToken.org_code, "Estimates", getMaxEstimates);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "GetAllEstimates",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_code,
        api: "Estimates"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimatesRetrieved",
      value: 1
    });

    context.res = {
      status: 200,
      body: {
        estimates: fetchedEstimates,
        maxEstimatesReached: maxEstimatesReached
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get all estimates failed"),
      properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getEstimates;