import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import createProCheckoutSession from "./createProCheckoutSession";
import createTeamCheckoutSession from "./createTeamCheckoutSession";
import proUpgrade from "./proUpgrade";
import createTeam from "./createTeam";
import * as dotenv from 'dotenv';
import * as appInsights from 'applicationinsights';

dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  const invalidRequest = () => {
    context.res = {
      status: 400,
      body: "Invalid request path or method."
    };
  };

  if (req.method === "POST") {
    if (req.url.includes("pro-checkout")) {
      await createProCheckoutSession(context, req);
      return;
    } else if (req.url.includes("team-checkout")) {
      await createTeamCheckoutSession(context, req);
      return;
    }
  } else if (req.method === "PUT") {
    if (req.url.includes("pro-upgrade")) {
      await proUpgrade(context, req);
      return;
    } else if (req.url.includes("create-team")) {
      await createTeam(context, req);
      return;
    }
  }

  invalidRequest();
};

export default httpTrigger;
