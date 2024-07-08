import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { verifyKindeToken } from "../utils/security";
import { KindeTokenDecoded } from "../utils/security";

import * as dotenv from 'dotenv';
import createBillingSession from "./createBillingSession";
let appInsights = require('applicationinsights');


dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  // Verify that the request is authenticated
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

  if (req.method === "POST") {
    if (req.params.action == "billing-session") {
      await createBillingSession(context, req, decodedToken);
      return;
    }
  }

  context.res = {
    status: 400,
    body: "Invalid request method."
  };
};

export default httpTrigger;