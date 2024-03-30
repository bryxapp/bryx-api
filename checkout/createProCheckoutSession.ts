import { Context, HttpRequest } from "@azure/functions";
import Stripe from 'stripe';

let appInsights = require('applicationinsights');
const proPriceId = 'price_1P09ZNEjO3JKZRm1hxRNcvY2';

const createProCheckoutSession = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    // Initialize the Stripe client
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });

    const email = req.body.email? req.body.email : "";

    // Create a new checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: proPriceId,
        quantity: 1,
      }],
      mode: 'subscription',
      automatic_tax: { enabled: true },
      success_url: `${req.headers.origin}/pro-checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/'pro-checkout?canceled=true&session_id={CHECKOUT_SESSION_ID}`,
      customer_email: email,
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