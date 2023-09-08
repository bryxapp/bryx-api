import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
let appInsights = require('applicationinsights');


const createUser = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    // Validate there is a body and the body contains fields user,templateId,estimateName, and estimateImgObj
    if (!req.body || !req.body.user || !req.body.user.user_id) {
      context.res = {
        status: 400,
        body: "Please pass a valid user object in the request body"
      };
      return;
    }
    const newUser = {
      userId: req.body.user.user_id,
      auth0UserId: req.body.user.user_id,
      subscription: "",
      stripeUserId: "",
    }

    // Get the database
    const container = await getDatabaseContainer("Users");

    // Create the estimate document
    const { resource: createdUser } = await container.items.create({ ...newUser });

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "CreateUser",
      properties: {
        userId: newUser.userId,
        api: "Users"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "UserCreated",
      value: 1
    });

    // Return the created user
    context.res = {
      status: 201,
      body: {
        "msg": "User created successfully.",
        "userId": createdUser.userId,
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

export default createUser;