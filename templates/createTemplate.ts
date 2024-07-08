import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { KindeTokenDecoded } from "../utils/security";

import { checkMaxCounts, getMaxTemplates } from "../utils/checkMaxCount";
let appInsights = require('applicationinsights');


const createTemplate = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    // Check if the user has reached the maximum number of templates
    if (await checkMaxCounts(decodedToken.sub, decodedToken.org_code, "Templates", getMaxTemplates)) {
      context.res = {
        status: 400,
        body: "You have reached the maximum number of templates. Please upgrade your subscription to create more templates."
      };
      appInsights.defaultClient.trackException({
        exception: new Error("Max Templates Reached"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Templates" }
      });
      return;
    }

    const newTemplate = req.body;
    newTemplate.userId = decodedToken.sub;
    newTemplate.orgId = decodedToken.org_code? decodedToken.org_code : null;
    newTemplate.status = "active";

    // Validate the template data
    if (!newTemplate || !newTemplate.friendlyName || !newTemplate.canvasDesign) {
      context.res = {
        status: 400,
        body: "Template data is invalid. It must contain friendlyName and canvasDesign."
      };
      return;
    }


    //Get the database connection
    const container = await getDatabaseContainer("Templates");

    // Create the template
    const { resource: createdTemplate } = await container.items.create(newTemplate);
    
    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "CreateTemplate",
      properties: {
         userId: decodedToken.sub,
          templateId: createdTemplate.id,
          api: "Templates",
          orgId: decodedToken.org_code }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "TemplateCreated",
      value: 1
    });


    // Return the template
    context.res = {
      status: 201,
      body: {
        "msg": "Template created successfully.",
        "template": createdTemplate,
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Template creation failed"), properties: { userId: decodedToken.sub, templateId: req.params.templateId, api: "Templates", orgId: decodedToken.org_code }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createTemplate;