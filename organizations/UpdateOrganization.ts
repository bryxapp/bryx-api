import { Context, HttpRequest } from "@azure/functions";
import { AuthType } from "../utils/security";
import { UpdateOrganization } from "../utils/auth0";
import { updateOrg } from "../utils/orgInfo";
import * as multipart from "parse-multipart";
import { deleteImageBlob, uploadImage } from "../utils/blobstorage";
import { getOrganizationById } from "./orgUtils";

let appInsights = require('applicationinsights');

const updateOrganization = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
  try {
    if (!req.headers["content-type"] || !req.headers["content-type"].startsWith("multipart/form-data")) {
      context.res = {
          status: 400,
          body: "Invalid Content-Type"
      };
      return;
  }
    const orgId = decodedToken.org_id;
    if (!orgId) {
      context.res = {
        status: 404,
        body: "Org ID not found."
      };
      return;
    }

    if (!req.body.newTeamName || !req.body.primaryColor || !req.body.secondaryColor || !req.body.newLogo === true) {
      context.res = {
        status: 400,
        body: "Please pass a valid newTeamName, primaryColor, secondaryColor, or logo in the request body"
      };
      return;
    }

    const org = await getOrganizationById(orgId);
    if (!org) {
      context.res = {
        status: 404,
        body: "Org not found."
      };
      return;
    }

    if (req.body.newLogo === true) {
      const boundary = multipart.getBoundary(req.headers["content-type"]);
      const parts = multipart.Parse(Buffer.from(req.body), boundary);
      const file = parts[0];
      const fileName = file.filename;
      const mimeType = file.type;
      const imageBlobUrl = await uploadImage(file,"organization-logos-container");
      req.body.logoUrl = imageBlobUrl;

      // Delete the old logo
      try{
        await deleteImageBlob(org.logoUrl, "organization-logos-container");
      }
      catch (error) {
        appInsights.defaultClient.trackException({
          exception: new Error("Delete Logo Failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Organizations" }
        });
        context.res = {
          status: 500,
          body: error.message
        };
        return;
      }
    }

    //Update Auth0 Org Name
    await UpdateOrganization(orgId, req.body.newTeamName, req.body.primaryColor, req.body.secondaryColor, req.body.logoUrl);

    //Update Bryx DB Org Name
    await updateOrg(orgId, req.body.newTeamName, req.body.primaryColor, req.body.secondaryColor, req.body.logoUrl);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "UpdateOrg",
      properties: {
        userId: decodedToken.sub,
        api: "Organizations"
      }
    });

    // Log a custom metric
    telemetryClient.trackMetric({
      name: "OrgUpdated",
      value: 1
    });


    context.res = {
      status: 200,
      body: {
        message: "Org Updates",
        teamName: req.body.newTeamName
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Renaming Org Failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default updateOrganization;