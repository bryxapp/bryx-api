import { Context, HttpRequest } from "@azure/functions";
import { UserSubscription, setUserSubscriptionPro } from "../utils/userInfo";
import Stripe from 'stripe';


let appInsights = require('applicationinsights');

const proUpgrade = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });
    //Validate Body
    if (!req.body || !req.body.sessionId || !req.body.userId) {
      context.res = {
        status: 400,
        body: "Please pass a valid sessionId and userId in the request body"
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

    // Update the DB with the new subscription
    setUserSubscriptionPro(userId, session.customer.toString());

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event
    telemetryClient.trackEvent({
      name: "upgradePro",
      properties: {
        api: "Checkout"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "UpgradedToPro",
      value: 1
    });

    context.res = {
      status: 200,
      body: session
    };

  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Upgrading to Pro failed"), properties: { body: req.body, api: "Checkout" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default proUpgrade;