import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { deleteImageBlob } from "../utils/blobstorage";
import { AuthType } from "../utils/Types/authType";
let appInsights = require("applicationinsights");

const deleteImage = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
    try {
        const imageId = req.params.imageId;

        // Validate the estimate ID
        if (!imageId) {
            context.res = {
                status: 400,
                body: "Image ID is required."
            };
            return;
        }

        //Get the database connection
        const container = await getDatabaseContainer("UserImages");

        //Fetch the image
        const { resource: image } = await container.item(imageId, undefined).read();

        //Delete the image blob from blob storage
        await deleteImageBlob(image.imageBlobUrl);

        //Delete the image from Cosmos DB
        await container.item(imageId, undefined).delete();

        // Create a new telemetry client
        const telemetryClient = appInsights.defaultClient;
        //Log the event 
        telemetryClient.trackEvent({
            name: "DeleteUserImage",
            properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_id,
        api: "Images"
      }        });
        // Log a custom metric
        telemetryClient.trackMetric({
            name: "UserImageDeleted",
            value: 1
        });


        context.res = {
            status: 200,
            body: "Image deleted successfully."
        };

    } catch (error) {
        appInsights.defaultClient.trackException({
            exception: new Error("Delete user image failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Images" }
        });
        context.res = {
            status: 500,
            body: error.message
        };
    }
};

export default deleteImage;