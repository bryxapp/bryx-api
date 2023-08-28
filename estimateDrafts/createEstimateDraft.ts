import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/Types/authType";
let appInsights = require('applicationinsights');


const createEstimateDraft = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const newEstimateDraft = req.body;

    // Validate there is a body and the body contains fields user,templateId,estimateName, and estimateImgObj

    if (!newEstimateDraft || !newEstimateDraft.templateId || !newEstimateDraft.estimateName || !newEstimateDraft.filledFields) {
      context.res = {
        status: 400,
        body: "Please pass a valid estimate draft object in the request body"
      };
      return;
    }
    newEstimateDraft.userId = decodedToken.sub;
    newEstimateDraft.orgId = decodedToken.org_id? decodedToken.org_id : null;

    // Get the database
    const container = await getDatabaseContainer("EstimateDrafts");

    // Create the estimate document
    const { resource: createdEstimateDraft } = await container.items.create({ ...newEstimateDraft });

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "CreateEstimateDraft",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_id,
        api: "Estimates"
      }    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateDraftCreated",
      value: 1
    });

    // Return the estimate document
    context.res = {
      status: 201,
      body: {
        "msg": "Estimate Draft created successfully.",
        "id": newEstimateDraft.id,
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Create estimate draft failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Estimates" }
    });

    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createEstimateDraft;