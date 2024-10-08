import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import createUser from "./createUser";
import getUserById from "./getUserById";
import updateUser from "./updateUser";
import { verifyAuth0Token } from "../utils/security";
import * as dotenv from 'dotenv';
import { AuthType } from "../utils/security";
import deleteUserSub from "./deleteUserSub";
import getOrganizationsForUser from "./getOrganizationsForUser";

let appInsights = require('applicationinsights');

dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  if (req.method === "POST") {
    await createUser(context, req);
    return;
  }

  if (req.method === "PUT") {
    await updateUser(context, req);
    return;
  }

  if (req.method === "DELETE") {
    await deleteUserSub(context, req);
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
      decodedToken = verifyAuth0Token(token);
    } catch (error) {
      context.res = { status: 401 };
      return;
    }

    if (!decodedToken) {
      context.res = { status: 401 };
      return;
    }

    if (req.params.userId && req.params.userId === "organizations") {
      await getOrganizationsForUser(context, req, decodedToken);
      return;
    }

    await getUserById(context, req, decodedToken);
    return;
  }

  context.res = {
    status: 400,
    body: "Invalid request method."
  };
};

export default httpTrigger;