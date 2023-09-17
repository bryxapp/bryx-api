import { Context, HttpRequest } from "@azure/functions";
import { uploadImage } from "../utils/blobstorage";
import { getDatabaseContainer } from "../utils/database";
import { checkMaxCounts, getMaxUserImages } from "../utils/checkMaxCount";
import * as multipart from "parse-multipart";
import { AuthType } from "../utils/security";

let appInsights = require("applicationinsights");

const createUserImage = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
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
    if (await checkMaxCounts(decodedToken.sub, decodedToken.org_id, "UserImages", getMaxUserImages)) {
        context.res = {
            status: 400,
            body: "You have reached the maximum number of images."
        };
        appInsights.defaultClient.trackException({
            exception: new Error("Max Images Reached"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Images" }
        });
        return;
    }

    try {
        const boundary = multipart.getBoundary(req.headers["content-type"]);
        const parts = multipart.Parse(Buffer.from(req.body), boundary);

        const userId = decodedToken.sub;
        const orgId = decodedToken.org_id? decodedToken.org_id : null;
        const file = parts[0];
        const fileName = file.filename;
        const mimeType = file.type;
        const imageBlobUrl = await uploadImage(file);

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
        orgId: decodedToken.org_id,
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
            exception: new Error("New user image failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Images" }
        });
        context.res = {
            status: 500,
            body: "Internal Server Error - " + err.message
        };
        return;
    }
};

export default createUserImage;