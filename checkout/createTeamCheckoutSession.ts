import { Context, HttpRequest } from "@azure/functions";
import Stripe from 'stripe';

let appInsights = require('applicationinsights');
const TeamPriceId = 'price_1P09ZCEjO3JKZRm1arSzZFsI';

const createTeamCheckoutSession = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    // Initialize the Stripe client
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });

    // Validate the request body
    if (!req.body || !req.body.teamName) {
      context.res = {
        status: 400,
        body: "Please pass a valid team name in the request body"
      };
      return;
    }

    const teamName = req.body.teamName;
    const email = req.body.email? req.body.email : "";

    // Create a new checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: TeamPriceId,
        quantity: 1,
      }],
      mode: 'subscription',
      automatic_tax: { enabled: true },
      success_url: `${req.headers.origin}/team-checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/'team-checkout?canceled=true&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        teamName: teamName
      },
      customer_email: email,
    });

    // Log telemetry
    const telemetryClient = appInsights.defaultClient;
    telemetryClient.trackEvent({
      name: "CreateTeamCheckoutSession",
      properties: {
        api: "Checkout"
      }
    });
    telemetryClient.trackMetric({
      name: "TeamCheckoutSessionCreated",
      value: 1
    });

    context.res = {
      status: 200,
      body: session
    };
  } catch (error) {
    // Handle errors and log telemetry
    appInsights.defaultClient.trackException({
      exception: new Error("Create team checkout session failed"),
      properties: { body: req.body, api: "Checkout" }
    });

    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createTeamCheckoutSession;