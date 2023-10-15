import { Context, HttpRequest } from "@azure/functions";
import { Subscription, updateUserInfo } from "../utils/userInfo";
import Stripe from 'stripe';


let appInsights = require('applicationinsights');

const proUpgrade = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });
    // Validate there is a body and the body contains fields priceId
    if (!req.body || !req.body.sessionId || !req.body.userId || !req.body.subscriptionName) {
      context.res = {
        status: 400,
        body: "Please pass a valid sessionId, userId, and subscriptionName in the request body"
      };
      return;
    }
    const sessionId = req.body.sessionId;
    const userId = req.body.userId;
    const subscriptionName = req.body.subscriptionName as Subscription;
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
    updateUserInfo(userId, session.customer.toString(), subscriptionName);

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