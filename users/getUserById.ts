import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { KindeTokenDecoded } from "../utils/security";

let appInsights = require('applicationinsights');

const getUserById = async (context: Context, req: HttpRequest, decodedToken: KindeTokenDecoded): Promise<void> => {
  try {
    const userId = decodedToken.sub;
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
    if(!users || users.length === 0) {
      context.res = {
        status: 404,
        body: "User not found."
      };
      return;
    }
    const user = users[0];

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "GetUserById",
      properties: {
        userId: decodedToken.sub,
        api: "Users"
      }
    });

    // Log a custom metric
    telemetryClient.trackMetric({
      name: "UserRetrieved",
      value: 1
    });

    if (!user) {
      context.res = {
        status: 404,
        body: "User not found."
      };
      return;
    }

    context.res = {
      status: 200,
      body: user
    };
  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Get user by id failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_code, api: "Users" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default getUserById;