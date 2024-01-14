import { Context, HttpRequest } from "@azure/functions";
import { uploadPdf } from "../utils/blobstorage";
import { getDatabaseContainer } from "../utils/database";
import { createPDF } from "../utils/pdf";
import { AuthType } from "../utils/security";

let appInsights = require('applicationinsights');


const createEstimatePDF = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
    try {
        const newEstimatePdf = req.body;
        // Validate there is a body and the body contains fields user,templateId,estimateName, and estimateImgObj
        if (!newEstimatePdf || !newEstimatePdf.estimateId || !newEstimatePdf.estimateImgObj) {
            context.res = {
                status: 400,
                body: "Please pass a valid estimate pdf creation object in the request body"
            };
            return;
        }

        // Get the estimate object
        const container = await getDatabaseContainer("Estimates");
        const { resource: estimate } = await container.item(newEstimatePdf.estimateId).read();
        if (!estimate) {
            context.res = {
                status: 404,
                body: "Estimate not found"
            };
            return;
        }

        const estimateHeight = newEstimatePdf.estimatePDFHeight ? newEstimatePdf.estimatePDFHeight : 792;
        const estimateWidth = newEstimatePdf.estimatePDFWidth ? newEstimatePdf.estimatePDFWidth : 612;

        // convert estimateImgObj to a pdf and store it in blob storage
        const estimatePdf = createPDF(newEstimatePdf.estimateImgObj, estimateHeight, estimateWidth);

        const blobUrl = uploadPdf(estimatePdf, estimate.estimateName);

        // Add the blob url to the estimate object
        estimate.estimatePdfUrl = blobUrl;

        // Update the estimate object
        const { resource: updatedEstimate } = await container.items.upsert({ ...estimate });

        // Create a new telemetry client
        const telemetryClient = appInsights.defaultClient;
        //Log the event 
        telemetryClient.trackEvent({
            name: "CreateEstimatePDF",
            properties: {
                userId: decodedToken.sub,
                orgId: decodedToken.org_id,
                api: "Estimates"
            }
        });
        // Log a custom metric
        telemetryClient.trackMetric({
            name: "EstimatePDFCreated",
            value: 1
        });

        // Return the estimate document
        context.res = {
            status: 201,
            body: {
                "msg": "Estimate PDF created successfully.",
                "id": updatedEstimate.id,
                "estimatePdfUrl": updatedEstimate.estimatePdfUrl
            }
        };
    } catch (error) {
        appInsights.defaultClient.trackException({
            exception: new Error("Create pdf estimate failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Estimates" }
        });
        context.res = {
            status: 500,
            body: error.message
        };
    }
};

export default createEstimatePDF;