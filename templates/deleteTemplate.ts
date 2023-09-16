import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";

let appInsights = require('applicationinsights');

const deleteTemplate = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    const templateId = req.params.templateId;

    // Validate the template ID
    if (!templateId) {
      context.res = {
        status: 400,
        body: "Template ID is required."
      };
      return;
    }

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;

    // Log a custom event
    telemetryClient.trackEvent({
      name: "DeleteTemplate",
      properties: {
        userId: decodedToken.sub,
        templateId: templateId,
        api: "Templates",
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "TemplatesDeleted",
      value: 1
    });


    //Get the database connection
    const container = await getDatabaseContainer("Templates");

    await container.item(templateId, undefined).delete();


    context.res = {
      status: 200,
      body: "Template deleted successfully."
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Template deletion failed"), properties: { userId: decodedToken.sub, templateId: req.params.templateId, api: "Templates" }
    });

    context.res = {
      status: 500,
      body: "An error occurred while deleting the template."
    };
  }
};

export default deleteTemplate;