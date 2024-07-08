import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { KindeTokenDecoded } from "../utils/security";

let appInsights = require('applicationinsights');

const getTemplateById = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
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

    //Get the database connection
    const container = await getDatabaseContainer("Templates");

    const { resource: template } = await container.item(templateId, undefined).read();

    if (!template) {
      context.res = {
        status: 404,
        body: "Template not found."
      };
      return;
    }
    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "GetTemplateById",
      properties: { userId: decodedToken.sub, templateId: templateId, api: "Templates" }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "TemplateByIdRetrieved",
      value: 1
    });

    context.res = {
      status: 200,
      body: template
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get template by id failed"), properties: {
        userId: decodedToken.sub, templateId: req.params.templateId, api: "Templates"
      }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getTemplateById;