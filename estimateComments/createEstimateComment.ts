import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { KindeTokenDecoded } from "../utils/security";
let appInsights = require('applicationinsights');


const createEstimateComment = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    const newEstimateComment = req.body;

    // Validate there is a body and the body contains fields user,templateId,estimateName, and estimateImgObj

    if (!newEstimateComment || !newEstimateComment.userName || !newEstimateComment.estimateId || !newEstimateComment.comment) {
      context.res = {
        status: 400,
        body: "Please pass a valid estimate comment object in the request body"
      };
      return;
    }
    newEstimateComment.userId = decodedToken.sub;

    // Get the database
    const container = await getDatabaseContainer("EstimateComments");

    // Create the estimate document
    const { resource: createdEstimateComment } = await container.items.create({ ...newEstimateComment });

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "CreateEstimateComment",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_code,
        api: "Estimates"
      }    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateCommentCreated",
      value: 1
    });

    // Return the estimate document

    context.res = {
      status: 201,
      body: {
        "msg": "Estimate comment created successfully.",
        "estimateComment": createdEstimateComment
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Create estimate comment failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createEstimateComment;