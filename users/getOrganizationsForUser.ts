import { Context, HttpRequest } from "@azure/functions";
import { AuthType } from "../utils/security";
import { GetOrganizationsForUser } from "../utils/auth0";

let appInsights = require('applicationinsights');

const getOrganizationsForUser = async (context: Context, req: HttpRequest, decodedToken: AuthType): Promise<void> => {
    try {
        const userId = decodedToken.sub;

        const organizations = GetOrganizationsForUser(userId);

        // Create a new telemetry client
        const telemetryClient = appInsights.defaultClient;
        //Log the event 
        telemetryClient.trackEvent({
            name: "GetOrganizationsForUser",
            properties: {
                userId: decodedToken.sub,
                api: "Users"
            }
        });

        // Log a custom metric
        telemetryClient.trackMetric({
            name: "OrganizationsRetrieved",
            value: 1
        });

        if (!organizations) {
            context.res = {
                status: 404,
                body: "User not found."
            };
            return;
        }

        context.res = {
            status: 200,
            body: organizations
        };
    } catch (error) {
        appInsights.defaultClient.trackException({
            exception: new Error("Get organizations by user id failed"), properties: { userId: decodedToken.sub, orgId: decodedToken.org_id, api: "Users" }
        });
        context.res = {
            status: 500,
            body: error.message
        };
    }
};

export default getOrganizationsForUser;