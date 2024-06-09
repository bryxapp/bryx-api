import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import createEstimate from "./createEstimate";
import getEstimates from "./getEstimates";
import getEstimateById from "./getEstimateById";
import getTemplatesUsed from "./getTemplatesUsed";
import deleteEstimate from "./deleteEstimate";
import { verifyAuth0Token } from "../utils/security";
import { AuthType } from "../utils/security";

import * as dotenv from 'dotenv';
import createEstimatePDF from "./createPDF";
let appInsights = require('applicationinsights');

dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {

    // Determine the handler method based on the HTTP method and route
    let handler;
    let skipTokenCheck = false;
    switch (req.method) {
        case 'POST':
            if (req.params.estimateId && req.params.estimateId === "pdf") {
                handler = createEstimatePDF;
                skipTokenCheck = true; // Skip token check for createEstimatePDF
            } else {
                handler = createEstimate;
            }
            break;
        case 'GET':
            if (req.params.estimateId && req.params.estimateId === "templates") {
                handler = getTemplatesUsed;
            } else if (req.params.estimateId) {
                handler = getEstimateById;
                skipTokenCheck = true; // Skip token check for getEstimateById
            } else {
                handler = getEstimates;
            }
            break;
        case 'DELETE':
            handler = deleteEstimate;
            break;
        default:
            handler = null;
    }

    // Verify that the request is authenticated, unless skipTokenCheck is true
    if (!skipTokenCheck) {
        const token = req.headers.authorization;
        if (!token) {
            context.res = { status: 401 };
            return;
        }

        let decodedToken: AuthType;
        try {
            decodedToken = verifyAuth0Token(token);
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
        // If token check is skipped, call the handler directly without token
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