import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import createTemplate from "./createTemplate";
import getAllTemplates from "./getAllTemplates";
import getTemplateById from "./getTemplateById";
import updateTemplate from "./updateTemplate";
import deleteTemplate from "./deleteTemplate";
import { verifyToken } from "../utils/security";
import * as dotenv from 'dotenv';
import { AuthType } from "../utils/types/authType";
let appInsights = require('applicationinsights');

dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const methodHandlers = {
    POST: createTemplate,
    GET: req.params.templateId ? getTemplateById : getAllTemplates,
    PUT: updateTemplate,
    DELETE: deleteTemplate
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