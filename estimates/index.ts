import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import createEstimate from "./createEstimate";
import getEstimates from "./getEstimates";
import getEstimateById from "./getEstimateById";
import deleteEstimate from "./deleteEstimate";
import { verifyToken } from "../utils/security";
import { AuthType } from "../utils/Types/authType";
import * as dotenv from 'dotenv';
let appInsights = require('applicationinsights');


dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const methodHandlers = {
    POST: createEstimate,
    GET: req.params.estimateId? getEstimateById : getEstimates,
    DELETE: deleteEstimate
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