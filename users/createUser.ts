import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { UserSubscriptionNames } from "../utils/userInfo";
import { KindeTokenDecoded } from "../utils/security";
let appInsights = require('applicationinsights');
import { v4 as uuidv4 } from 'uuid';


const createUser = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    const newUser = {
      userId: uuidv4(), //generate a guid for userId
      kindeUserId: decodedToken.sub,
      subscription: UserSubscriptionNames.STARTER,
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