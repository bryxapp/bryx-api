import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import createUser from "./createUser";
import getUserById from "./getUserById";
import updateUser from "./updateUser";
import { verifyKindeToken } from "../utils/security";
import * as dotenv from 'dotenv';
import { KindeTokenDecoded } from "../utils/security";
import deleteUserSub from "./deleteUserSub";

let appInsights = require('applicationinsights');

dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {

    // Determine the handler method based on the HTTP method
    let handler;
    let requiresToken = false;

    switch (req.method) {
        case 'POST':
            handler = createUser;
            requiresToken = true;
            break;
        case 'GET':
            handler = getUserById;
            requiresToken = true;
            break;
        case 'PUT':
            handler = updateUser;
            break;
        case 'DELETE':
            handler = deleteUserSub;
            break;
        default:
            handler = null;
    }

    // Verify that the request is authenticated, if required
    if (requiresToken) {
        const token = req.headers.authorization;
        if (!token) {
            context.res = { status: 401 };
            return;
        }

        let decodedToken: KindeTokenDecoded;
        try {
            decodedToken = await verifyKindeToken(token);
        } catch (error) {
            context.res = { status: 401 };
            return;
        }

        if (!decodedToken) {
            context.res = { status: 401 };
            return;
        }

        if (handler) {
            await handler(context, req, decodedToken);
        } else {
            context.res = {
                status: 400,
                body: "Invalid request method."
            };
        }
    } else {
        // If token check is not required, call the handler directly without token
        if (handler) {
            await handler(context, req);
        } else {
            context.res = {
                status: 400,
                body: "Invalid request method."
            };
        }
    }
};

export default httpTrigger;