import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as dotenv from 'dotenv';
import Stripe from 'stripe';
import { checkoutSessionCompleted, subscriptionDeleted,invoicePaymentFailed, invoicePaid } from "./checkoutSessionCompleted";

let appInsights = require('applicationinsights');

dotenv.config();
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  if (req.method === "POST") {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });
    try {
      const sig_header = req.headers['stripe-signature'];
      const event = stripe.webhooks.constructEvent(req.body, sig_header, process.env.STRIPE_WEBHOOK_SECRET);
      const eventData = event.data;
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          await checkoutSessionCompleted(checkoutSession);
          break;
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await subscriptionDeleted(subscription);
          break;
        case 'invoice.paid':
          const invoice = event.data.object as Stripe.Invoice;
          await invoicePaid(invoice);
          break;
        case 'invoice.payment_failed':
          const invoiceFailed = event.data.object as Stripe.Invoice;
          await invoicePaymentFailed(invoiceFailed);
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