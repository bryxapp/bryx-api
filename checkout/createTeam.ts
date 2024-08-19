import { Context, HttpRequest } from "@azure/functions";
import Stripe from 'stripe';
import { AddUserToOrganization, createAuth0Organization } from "../utils/kinde-x";
import { createOrg } from "../utils/orgInfo";
let appInsights = require('applicationinsights');

const createTeam = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });
    // Validate body
    if (!req.body || !req.body.sessionId || !req.body.userId) {
      context.res = {
        status: 400,
        body: "Please pass a valid sessionId and userId"
      };
      return;
    }
    const sessionId = req.body.sessionId;
    const userId = req.body.userId;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if the session was successful (you can customize this check based on your needs)
    if (session.payment_status !== 'paid') {
      context.res = {
        status: 400,
        body: "Payment was not successful."
      };
      return;
    }
    const stripeUserId = session.customer as string;
    let teamName = session.metadata.teamName;
    if (!teamName) {
      teamName = "My Team";
    }

    //Create Org in Auth0
    const orgId = await createAuth0Organization(teamName);
    //Create Org in DB
    await createOrg(orgId, teamName, userId, stripeUserId);
    //Add user to Org in Auth0
    await AddUserToOrganization(userId, orgId);

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event
    telemetryClient.trackEvent({
      name: "CreateTeam",
      properties: {
        api: "Checkout"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "TeamCreated",
      value: 1
    });

    context.res = {
      status: 200,
      body: session
    };

  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Create team failed"), properties: { body: req.body, api: "Checkout" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createTeam;