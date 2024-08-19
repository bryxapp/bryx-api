import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { KindeTokenDecoded } from "../utils/security";

import { checkMaxCounts, getMaxTemplates } from "../utils/checkMaxCount";
import { get } from "http";
let appInsights = require('applicationinsights');

const getAllTemplates = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    const userId = decodedToken.sub;
    const orgId = decodedToken.org_code? decodedToken.org_code : null;
    const container = await getDatabaseContainer("Templates");

    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
    const pageNumber = req.query.pageNumber ? parseInt(req.query.pageNumber) : 1;
    const skipCount = (pageNumber - 1) * pageSize;


    // Get templates with paging
    let queryString = "SELECT * FROM c WHERE c.orgId = @orgId AND c.status = 'active'";
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
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_code,
        api: "Templates"
      }    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "TemplatesRetrieved",
      value: 1
    });

    const maxTemplatesReached = await checkMaxCounts(decodedToken.sub, decodedToken.org_code, "Templates", getMaxTemplates);

    context.res = {
      status: 200,
      body: {
        "templates": allTemplates,
        "maxTemplatesReached": maxTemplatesReached
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get all templates failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Templates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getAllTemplates;