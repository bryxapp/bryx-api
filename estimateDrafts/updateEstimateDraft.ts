import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";

let appInsights = require('applicationinsights');

const updateEstimateDraft = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {

    try {
        const estimateDraftId = req.params.estimateDraftId;
        const updatedEstimateDraftData = req.body;

        if (!estimateDraftId) {
            context.res = {
                status: 400,
                body: "Estimate Draft ID is required."
            };
            return;
        }

        if (!updatedEstimateDraftData || !updatedEstimateDraftData.templateId || !updatedEstimateDraftData.estimateName || !updatedEstimateDraftData.filledFields) {
            context.res = {
                status: 400,
                body: "Please pass a valid estimate object in the request body"
            };
            return;
        }

        updatedEstimateDraftData.userId = decodedToken.sub;

        // Get the template from the database
        const container = await getDatabaseContainer("EstimateDrafts");

        const estimateDraft = await container.item(estimateDraftId).read();


        if (!estimateDraft) {
            context.res = {
                status: 404,
                body: "Template not found."
            };
            return;
        }

        // Update the template in the database
        const { resource: updatedEstimateDraft } = await container.item(estimateDraftId).replace(updatedEstimateDraftData);

        if (!updatedEstimateDraft) {
            context.res = {
                status: 500,
                body: "Error updating the template."
            };
            return;
        }
        // Create a new telemetry client
        const telemetryClient = appInsights.defaultClient;
        //Log the event 
        telemetryClient.trackEvent({
            name: "UpdateEstimateDraft",
            properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_id,
        api: "Estimates"
      }        });
        // Log a custom metric
        telemetryClient.trackMetric({
            name: "EstimateDraftUpdated",
            value: 1
        });
        context.res = {
            status: 200,
            body: {
                "msg": "Estimate Draft updated successfully.",
            }
        };
    } catch (error) {
        appInsights.defaultClient.trackException({
            exception: new Error("Update estimate draft failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Estimates" }
        });
        context.res = {
            status: 500,
            body: error.message
        };
    }
};

export default updateEstimateDraft;