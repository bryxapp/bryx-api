import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as dotenv from 'dotenv';
import Stripe from 'stripe';
import { downgradeSubscription, upgradeSubscription } from "./util";

let appInsights = require('applicationinsights');

dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  if (req.method === "POST") {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });
    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    try {
      const sig_header = req.headers['stripe-signature'];
      const event = stripe.webhooks.constructEvent(req.body, sig_header, process.env.STRIPE_WEBHOOK_SECRET);
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          await upgradeSubscription(checkoutSession.customer as string);
          telemetryClient.trackEvent({
            name: "UpgradeSubscription",
            properties: {
              userId: checkoutSession.customer as string,
              subscriptionId: checkoutSession.subscription as string,
              event: checkoutSession,
              api: "Stripe",
            }
          });
          break;
        case 'customer.subscription.created':
          const subscriptionCreated = event.data.object as Stripe.Subscription;
          await upgradeSubscription(subscriptionCreated.customer as string);
          telemetryClient.trackEvent({
            name: "UpgradeSubscription",
            properties: {
              userId: subscriptionCreated.customer as string,
              subscriptionId: subscriptionCreated.id,
              event: subscriptionCreated,
              api: "Stripe",
            }
          });
          break;
        case 'invoice.paid':
          const invoice = event.data.object as Stripe.Invoice;
          await upgradeSubscription(invoice.customer as string);
          telemetryClient.trackEvent({
            name: "UpgradeSubscription",
            properties: {
              userId: invoice.customer as string,
              subscriptionId: invoice.subscription as string,
              event: invoice,
              api: "Stripe",
            }
          });
          break;
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await downgradeSubscription(subscription.customer as string);
          telemetryClient.trackEvent({
            name: "DowngradeSubscription",
            properties: {
              userId: subscription.customer as string,
              subscriptionId: subscription.id,
              event: subscription,
              api: "Stripe",
            }
          });
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      context.res = {
        status: 200,
        body: event
      };
    }
    catch (err) {
      appInsights.defaultClient.trackException({
        exception: new Error("Stripe webhook failed"), properties: { body: req.body, api: "Stripe" }
      });
      context.res = {
        status: 400,
        body: `Webhook Error: ${err.message}`
      };
    }
    return;
  }

  context.res = {
    status: 400,
    body: "Invalid request method."
  };
};

export default httpTrigger;