import { Context, HttpRequest } from "@azure/functions";
import { uploadImage } from "../utils/blobstorage";
import { getDatabaseContainer } from "../utils/database";
import { checkMaxCounts, getMaxUserImages } from "../utils/checkMaxCount";
import { KindeTokenDecoded } from "../utils/security";
import parseMultipartFormData from "@anzp/azure-function-multipart";

let appInsights = require("applicationinsights");

const createUserImage = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
    if (!req.headers["content-type"] || !req.headers["content-type"].startsWith("multipart/form-data")) {
        context.res = {
            status: 400,
            body: "Invalid Content-Type"
        };
        return;
    }

    if (!req.body) {
        context.res = {
            status: 400,
            body: "Invalid request, missing body"
        };
        return;
    }

    // Validate the user has not reached the maximum number of images
    if (await checkMaxCounts(decodedToken.sub, decodedToken.org_code, "UserImages", getMaxUserImages)) {
        context.res = {
            status: 400,
            body: "You have reached the maximum number of images."
        };
        appInsights.defaultClient.trackException({
            exception: new Error("Max Images Reached"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Images" }
        });
        return;
    }

    try {
        const {files} = await parseMultipartFormData(req);

        const userId = decodedToken.sub;
        const orgId = decodedToken.org_code? decodedToken.org_code : null;
        const file = files[0];
        const fileName = file.filename;
        const mimeType = file.mimeType;
        const imageBlobUrl = await uploadImage(file,"user-images-container");

        // Create a DB record of the new image
        const container = await getDatabaseContainer("UserImages");
        const image = {
            userId: userId,
            orgId: orgId,
            imageBlobUrl: imageBlobUrl,
            fileName: fileName,
            mimeType: mimeType
        };

        const { resource: createdImage } = await container.items.create(image);

        // Create a new telemetry client
        const telemetryClient = appInsights.defaultClient;
        //Log the event
        telemetryClient.trackEvent({
            name: "NewUserImage",
            properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_code,
        api: "Images"
      }        });
        // Log a custom metric
        telemetryClient.trackMetric({
            name: "UserImageCreated",
            value: 1
        });


        context.res = {
            status: 201,
            body: createdImage
        };
    } catch (err) {
        appInsights.defaultClient.trackException({
            exception: new Error("New user image failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Images" }
        });
        context.res = {
            status: 500,
            body: "Internal Server Error - " + err.message
        };
        return;
    }
};

export default createUserImage;