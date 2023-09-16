import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import createOrg from "./createOrg";
import getOrgById from "./getOrgById";
import updateOrg from "./updateOrg";
import { verifyToken } from "../utils/security";
import * as dotenv from 'dotenv';
import { AuthType } from "../utils/security";

let appInsights = require('applicationinsights');

dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  if (req.method === "POST") {
    await createOrg(context, req);
    return;
  }

  if (req.method === "PUT") {
    await updateOrg(context, req);
    return;
  }

  if (req.method === "GET") {

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
    getOrgById(context, req, decodedToken);
  }

  context.res = {
    status: 400,
    body: "Invalid request method."
  };
};

export default httpTrigger;