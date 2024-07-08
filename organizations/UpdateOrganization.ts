import { Context, HttpRequest } from "@azure/functions";
import { KindeTokenDecoded } from "../utils/security";
import { UpdateOrganization } from "../utils/kinde-x";
import { updateOrg } from "../utils/orgInfo";
import { deleteImageBlob, uploadImage } from "../utils/blobstorage";
import { getOrganizationById } from "./orgUtils";
import parseMultipartFormData from "@anzp/azure-function-multipart";

let appInsights = require('applicationinsights');

const updateOrganization = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    if (!req.headers["content-type"] || !req.headers["content-type"].startsWith("multipart/form-data")) {
      context.res = {
        status: 400,
        body: "Invalid Content-Type"
      };
      return;
    }
    const orgId = decodedToken.org_code;
    if (!orgId) {
      context.res = {
        status: 404,
        body: "Org ID not found."
      };
      return;
    }

    const { fields: multiPartFormFields, files: multiPartFormFiles } = await parseMultipartFormData(req);
    let file = multiPartFormFiles.length > 0 ? multiPartFormFiles[0] : null
    const fields = multiPartFormFields.reduce((acc, field) => {
      acc[field.name] = field.value;
      return acc;
    }, {});


    const org = await getOrganizationById(orgId);
    if (!org) {
      context.res = {
        status: 404,
        body: "Org not found."
      };
      return;
    }
    let imageBlobUrl = '';

    if (file) {
      imageBlobUrl = await uploadImage(file, "organization-logos-container");

      // Delete the old logo
      try {
        if (org.logoUrl) {
          await deleteImageBlob(org.logoUrl, "organization-logos-container");
        }
      }
      catch (error) {
        appInsights.defaultClient.trackException({
          exception: new Error("Delete Logo Failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Organizations" }
        });
        context.res = {
          status: 500,
          body: error.message
        };
        return;
      }
    }

    //Update Auth0 Org Name
    await UpdateOrganization(orgId, fields["newTeamName"], fields["primaryColor"], imageBlobUrl);

    //Update Bryx DB Org Name
    await updateOrg(orgId, fields["newTeamName"], fields["primaryColor"], fields["secondaryColor"], imageBlobUrl);

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
      exception: new Error("Renaming Org Failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Organizations" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default updateOrganization;