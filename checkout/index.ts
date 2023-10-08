import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import createCheckoutSession from "./createCheckoutSession";
import * as dotenv from 'dotenv';

let appInsights = require('applicationinsights');

dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  if (req.method === "POST") {
    await createCheckoutSession(context, req);
    return;
  }

  context.res = {
    status: 400,
    body: "Invalid request method."
  };
};

export default httpTrigger;