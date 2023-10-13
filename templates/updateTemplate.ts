import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";

let appInsights = require('applicationinsights');

const updateTemplate = async (context: Context, req: HttpRequest,decodedToken:AuthType): Promise<void> => {
  try {
    const templateId = req.params.templateId;
    const updatedTemplateData = req.body;
    const userId = decodedToken.sub;


    // Validate the template ID and has fields frindlyName and and canvasDesign
    if (!templateId) {
      context.res = {
        status: 400,
        body: "Template ID is required."
      };
      return;
    }

    if (!updatedTemplateData || !updatedTemplateData.friendlyName || !updatedTemplateData.canvasDesign) {
      context.res = {
        status: 400,
        body: "Template data is invalid. It must contain friendlyName, and canvasDesign."
      };
      return;
    }


    // Get the template from the database
    const container = await getDatabaseContainer("Templates");

    const template = await container.item(templateId).read();

    if (!template) {
      context.res = {
        status: 404,
        body: "Template not found."
      };
      return;
    }

    updatedTemplateData.id = templateId;
    updatedTemplateData.userId = userId;
    updatedTemplateData.orgId = decodedToken.org_id? decodedToken.org_id : null;
    updatedTemplateData.status = "active";
    // Update the template in the database
    const { resource: updatedTemplate } = await container.item(templateId).replace(updatedTemplateData);

        // Create a new telemetry client
        const telemetryClient = appInsights.defaultClient;
        //Log the event 
        telemetryClient.trackEvent({
          name: "UpdateTemplate",
          properties: { userId: userId, templateId: templateId, api: "Templates", orgId: decodedToken.org_id }
        });
        // Log a custom metric
        telemetryClient.trackMetric({
          name: "TemplateUpdated",
          value: 1
        });
    

    context.res = {
      status: 200,
      body: {
        "msg": "Template updated successfully.",
        "template": updatedTemplate
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Template update failed"), properties: { userId: decodedToken.sub, templateId: req.params.templateId, api: "Templates", orgId: decodedToken.org_id }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default updateTemplate;

