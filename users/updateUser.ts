import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
let appInsights = require('applicationinsights');

const updateUser = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const userId = req.params.userId;
    const updatedUserData = req.body.user;
    // Validate the template ID and has fields frindlyName and user and canvasDesign
    if (!userId) {
      context.res = {
        status: 400,
        body: "User ID is required."
      };
      return;
    }

    if (!updatedUserData || updatedUserData.userId != userId || !updatedUserData.userId || !updatedUserData.subscription || !updatedUserData.stripeUserId) {
      context.res = {
        status: 400,
        body: "User data is invalid. It must contain userId, auth0UserId, subscription, and stripeUserId."
      };
      return;
    }


    // Get the template from the database
    const container = await getDatabaseContainer("Users");

    const user = await container.item(userId).read();

    if (!user) {
      context.res = {
        status: 404,
        body: "user not found."
      };
      return;
    }
    updatedUserData.userId = userId;
    // Update the template in the database
    const { resource: updateUser } = await container.item(userId).replace(updatedUserData);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "UpdateUser",
      properties: { userId: userId, api: "Users", }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "UserUpdated",
      value: 1
    });


    context.res = {
      status: 200,
      body: {
        "msg": "User updated successfully.",
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("User update failed"), properties: { userId: req.params.userId, api: "Users" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default updateUser;

