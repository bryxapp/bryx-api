import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/Types/authType";
let appInsights = require("applicationinsights");

const getUserImageById = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
    try {
        const imageId = req.params.imageId;

        // Validate the Estimate ID
        if (!imageId) {
            context.res = {
                status: 400,
                body: "Image ID is required."
            };
            return;
        }

        // Get the database
        const container = await getDatabaseContainer("UserImages");

        const { resource: image } = await container.item(imageId, undefined).read();

        if (!image) {
            context.res = {
                status: 404,
                body: "Image not found."
            };
            return;
        }

        // Create a new telemetry client
        const telemetryClient = appInsights.defaultClient;
        //Log the event 
        telemetryClient.trackEvent({
            name: "GetUserImageById",
            properties: { userId: decodedToken.sub }
        });
        // Log a custom metric
        telemetryClient.trackMetric({
            name: "UserImageRetrieved",
            value: 1
        });


        context.res = {
            status: 200,
            body: image
        };
    } catch (error) {
        appInsights.defaultClient.trackException({
            exception: new Error("Get user image by ID failed"), properties: { userId: decodedToken.sub }
        });
        context.res = {
            status: 500,
            body: error.message
        };
    }
};

export default getUserImageById;