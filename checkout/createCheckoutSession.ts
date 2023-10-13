import { Context, HttpRequest } from "@azure/functions";
import Stripe from 'stripe';

let appInsights = require('applicationinsights');

const ProPriceId = 'price_1NypfzEjO3JKZRm1Wj1BdyDz';
const TeamPriceId = 'price_1NypgEEjO3JKZRm1JSmm4nSC';

const createCheckoutSession = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    // Initialize the Stripe client
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });

    // Validate the request body
    if (!req.body || !req.body.priceId) {
      context.res = {
        status: 400,
        body: "Please pass a valid priceId in the request body"
      };
      return;
    }

    // Define the cancel and success URLs based on the selected priceId
    const priceId = req.body.priceId;
    const isProPrice = priceId === ProPriceId;
    const cancel_url = `${req.headers.origin}/${isProPrice ? 'proCheckout' : 'teamCheckout'}?canceled=true&session_id={CHECKOUT_SESSION_ID}`;
    const success_url = `${req.headers.origin}/${isProPrice ? 'proCheckout' : 'teamCheckout'}?success=true&session_id={CHECKOUT_SESSION_ID}`;

    // Create a new checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: priceId,
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
      name: "CreateCheckoutSession",
      properties: {
        api: "Checkout"
      }
    });
    telemetryClient.trackMetric({
      name: "CheckoutSessionCreated",
      value: 1
    });

    context.res = {
      status: 200,
      body: session
    };
  } catch (error) {
    // Handle errors and log telemetry
    appInsights.defaultClient.trackException({
      exception: new Error("Create checkout session failed"),
      properties: { body: req.body, api: "Checkout" }
    });

    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createCheckoutSession;