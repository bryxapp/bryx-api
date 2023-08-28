import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import createEstimateDraft from "./createEstimateDraft";
import getEstimateDrafts from "./getEstimateDrafts";
import getEstimateDraftById from "./getEstimateDraftById";
import updateEstimateDraft from "./updateEstimateDraft";
import deleteEstimateDraft from "./deleteEstimateDraft";
import { verifyToken } from "../utils/security";
import { AuthType } from "../utils/Types/authType";
let appInsights = require('applicationinsights');
import * as dotenv from 'dotenv';


dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const methodHandlers = {
        "POST": createEstimateDraft,
        "GET": req.params.estimateDraftId ? getEstimateDraftById : getEstimateDrafts,
        "PUT": updateEstimateDraft,
        "DELETE": deleteEstimateDraft
    };

    // Verify that the request is authenticated
    const token = req.headers.authorization;
    if (!token) {
        context.res = { status: 401 };
        return;
    }

    let decodedToken: AuthType;
    try {
        decodedToken = verifyToken(token);
    } catch (error) {
        context.res = { status: 401 };
        return;
    }

    if (!decodedToken) {
        context.res = { status: 401 };
        return;
    }

    const handler = methodHandlers[req.method];
    if (handler) {
        await handler(context, req, decodedToken);
    } else {
        context.res = {
            status: 400,
            body: "Invalid request method."
        };
    }
};

export default httpTrigger;