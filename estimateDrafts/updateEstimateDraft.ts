import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";

let appInsights = require('applicationinsights');

function validateEstimate(newEstimate) {
    // Initialize an array to hold the names of missing fields
    const missingFields = [];

    // Check each required field and add to the array if it is missing
    if (!newEstimate) {
        missingFields.push('newEstimate object');
    } else {
        if (!newEstimate.templateId) {
            missingFields.push('templateId');
        }
        if (!newEstimate.estimateName) {
            missingFields.push('estimateName');
        }
        if (!newEstimate.canvasDesign) {
            missingFields.push('canvasDesign');
        }
        if (!newEstimate.fieldValues) {
            missingFields.push('fieldValues');
        }
    }
    // If there are any missing fields, return a detailed error message
    if (missingFields.length > 0) {
        return `Missing required field(s): ${missingFields.join(', ')}`;
    }

    // If no fields are missing, return null indicating no error
    return null;
}


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

        if (updatedEstimateDraftData) {
            const errorMessage = validateEstimate(updatedEstimateDraftData);
            if (errorMessage) {
                context.res = {
                    status: 400,
                    body: errorMessage
                };
                return;
            }
        } else {
            context.res = {
                status: 400,
                body: "Please pass a valid estimate object in the request body"
            };
            return;
        }

        updatedEstimateDraftData.userId = decodedToken.sub;
        updatedEstimateDraftData.orgId = decodedToken.org_id ? decodedToken.org_id : null;
        updatedEstimateDraftData.status = "active";

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
            }
        });
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