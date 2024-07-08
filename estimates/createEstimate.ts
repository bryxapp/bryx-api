import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { KindeTokenDecoded } from "../utils/security";

import { checkMaxCounts, getMaxEstimates } from "../utils/checkMaxCount";
let appInsights = require('applicationinsights');

// Function to check the validity of the newEstimate object
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
    if (!newEstimate.estimateImgObj) {
      missingFields.push('estimateImgObj');
    }
  }

  // If there are any missing fields, return a detailed error message
  if (missingFields.length > 0) {
    return `Missing required field(s): ${missingFields.join(', ')}`;
  }

  // If no fields are missing, return null indicating no error
  return null;
}

const createEstimate = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {

    if (await checkMaxCounts(decodedToken.sub, decodedToken.org_code, "Estimates", getMaxEstimates)) {
      context.res = {
        status: 400,
        body: "You have reached the maximum number of estimates for your subscription. Please upgrade your subscription to create more estimates."
      };
      appInsights.defaultClient.trackException({
        exception: new Error("Max Estimates Reached"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Estimates" }
      });

      return;
    }

    const newEstimate = req.body;
    // Validate there is a body and the body contains fields user,templateId,estimateName, and estimateImgObj
    // Main part of the function that uses the validation
    if (newEstimate) {
      const errorMessage = validateEstimate(newEstimate);
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


    newEstimate.userId = decodedToken.sub;
    newEstimate.orgId = decodedToken.org_code ? decodedToken.org_code : null;
    newEstimate.status = "active";
    newEstimate.createdDate = new Date().toISOString();

    // Get the database
    const container = await getDatabaseContainer("Estimates");

    // Create the estimate document
    const { resource: createdEstimate } = await container.items.create({ ...newEstimate });

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "CreateEstimate",
      properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_code,
        api: "Estimates"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "EstimateCreated",
      value: 1
    });

    // Return the estimate document
    context.res = {
      status: 201,
      body: {
        "msg": "Estimate created successfully.",
        "id": createdEstimate.id,
        "estimatePdfUrl": createdEstimate.estimatePdfUrl
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Create estimate failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Estimates" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createEstimate;