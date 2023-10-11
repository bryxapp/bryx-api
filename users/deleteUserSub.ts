import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
let appInsights = require('applicationinsights');


const deleteUserSub = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    // Validate the query params have userId
    const userId = req.params.userId;

    // Validate the Estimate ID
    if (!userId) {
      context.res = {
        status: 400,
        body: "User ID is required."
      };
      return;
    }
    // Get the database
    const container = await getDatabaseContainer("Users");

    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId",
      parameters: [
        {
          name: "@userId",
          value: userId
        }
      ]
    };

    // Get the user
    const { resources: users } = await container.items
      .query(querySpec).fetchAll();
    const user = users[0];
    user.subscription = null;
    // Update the user
    const { resource: updatedUser } = await container
      .item(user.id)
      .replace(user);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "ClearedSubscription",
      properties: {
        userId: userId,
        api: "Users"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "SubscriptionCleared",
      value: 1
    });

    // Return the created user
    context.res = {
      status: 201,
      body: {
        "msg": "Subscription cleared",
        "userId": userId,
      }
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Create user failed"), properties: { body: req.body, api: "Users" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default deleteUserSub;