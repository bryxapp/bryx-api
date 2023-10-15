import { Context, HttpRequest } from "@azure/functions";
import Stripe from 'stripe';

let appInsights = require('applicationinsights');
const proPriceId = '';

const createProCheckoutSession = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    // Initialize the Stripe client
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });

    // Validate the request body
    if (!req.body) {
      context.res = {
        status: 400,
        body: "Please pass a valid priceId in the request body"
      };
      return;
    }

    // Define the cancel and success URLs based on the selected priceId
    const cancel_url = `${req.headers.origin}/'pro-checkout?canceled=true&session_id={CHECKOUT_SESSION_ID}`;
    const success_url = `${req.headers.origin}/pro-checkout?success=true&session_id={CHECKOUT_SESSION_ID}`;

    // Create a new checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: proPriceId,
        quantity: 1,
      }],
      mode: 'subscription',
      automatic_tax: { enabled: true },
      success_url,
      cancel_url,
    });

    // Log telemetry
    const telemetryClient = appInsights.defaultClient;
    telemetryClient.trackEvent({
      name: "CreateProCheckoutSession",
      properties: {
        api: "Checkout"
      }
    });
    telemetryClient.trackMetric({
      name: "ProCheckoutSessionCreated",
      value: 1
    });

    context.res = {
      status: 200,
      body: session
    };
  } catch (error) {
    // Handle errors and log telemetry
    appInsights.defaultClient.trackException({
      exception: new Error("Create pro checkout session failed"),
      properties: { body: req.body, api: "Checkout" }
    });

    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createProCheckoutSession;