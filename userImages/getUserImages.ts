import { Context, HttpRequest } from "@azure/functions";
import { getDatabaseContainer } from "../utils/database";
import { AuthType } from "../utils/security";

let appInsights = require("applicationinsights");

const getUserImages = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
    try {
        const userId = decodedToken.sub;
        const orgId = decodedToken.org_id ? decodedToken.org_id : null;

        //Get the database connection
        const container = await getDatabaseContainer("UserImages");

        //Create Cosmos DB query for users images
        let queryString = "SELECT * FROM c WHERE c.orgId = @orgId ORDER BY c._ts DESC";
        if(!orgId) {
            queryString += " AND c.userId = @userId";
        }
        const querySpec = {
            query: queryString,
            parameters: [
                {
                    name: "@orgId",
                    value: orgId
                },
                {
                    name: "@userId",
                    value: userId
                }
            ]
        }

        //Fetch the estimates
        const { resources: userImages } = await container.items.query(querySpec).fetchAll();

        // Create a new telemetry client
        const telemetryClient = appInsights.defaultClient;
        //Log the event 
        telemetryClient.trackEvent({
            name: "GetAllUserImages",
            properties: {
        userId: decodedToken.sub,
        orgId: decodedToken.org_id,
        api: "Images"
      }        });
        // Log a custom metric
        telemetryClient.trackMetric({
            name: "UserImagesRetrieved",
            value: 1
        });

        context.res = {
            status: 200,
            body: userImages
        };

    } catch (error) {
        appInsights.defaultClient.trackException({
            exception: new Error("Get all user images failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Images" }
        });
        context.res = {
            status: 500,
            body: error.message
        };
    }
};

export default getUserImages;