import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import getOrgById from "./getOrgById";
import { verifyToken } from "../utils/security";
import * as dotenv from 'dotenv';
import { AuthType } from "../utils/security";
import inviteUser from "./InviteUser";
import getOrganizationMembers from "./GetOrganizationMembers";
import removeOrganizationMember from "./RemoveOrganizationMember";

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

  if (req.method === "POST") {
    if (req.params.action =="invite-user") {
      await inviteUser(context, req, decodedToken);
      return;
    }
  }

  if (req.method === "GET") {
    if (req.params.action =="members") {
      await getOrganizationMembers(context, req, decodedToken);
      return;
    }
    await getOrgById(context, req, decodedToken);
    return;
  }

  if (req.method === "DELETE") {
    await removeOrganizationMember(context, req, decodedToken);
    return;
  }

  context.res = {
    status: 400,
    body: "Invalid request method."
  };
};

export default httpTrigger;