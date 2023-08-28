import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/Types/authType";
let appInsights = require('applicationinsights');

const getAllTemplates = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const userId = decodedToken.sub;
    const orgId = decodedToken.org_id;
    const container = await getDatabaseContainer("Templates");

    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber) : 1;
    const skipCount = (pageNumber - 1) * pageSize;


    // Get templates with paging
    let queryString = "SELECT * FROM c WHERE c.orgId = @orgId";
    if(!orgId) {
      queryString += " AND c.userId = @userId";
    }
    queryString += " ORDER BY c._ts DESC OFFSET @skipCount LIMIT @pageSize";
    const { resources: allTemplates } = await container.items
      .query({
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
      })
      .fetchAll();

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "GetAllTemplates",
      properties: { userId: decodedToken.sub }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "TemplatesRetrieved",
      value: 1
    });

    context.res = {
      status: 200,
      body: allTemplates
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get all templates failed"), properties: { userId: decodedToken.sub }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getAllTemplates;