import { Context, HttpRequest } from "@azure/functions";
let appInsights = require('applicationinsights');

const createCheckoutSession = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // Validate there is a body and the body contains fields priceId
    if (!req.body || !req.body.priceId || req.body.userId) {
      context.res = {
        status: 400,
        body: "Please pass a valid priceId and userId in the request body"
      };
      return;
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [{
        price: req.body.priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      automatic_tax: {enabled: true},
      return_url: `${req.headers.origin}/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    // Create a new telemetry client
    const telemetryClient = appInsights.defaultClient;
    //Log the event 
    telemetryClient.trackEvent({
      name: "CreateCheckoutSession",
      properties: {
        api: "Checkout"
      }
    });
    // Log a custom metric
    telemetryClient.trackMetric({
      name: "CheckoutSessionCreated",
      value: 1
    });

    context.res = {
      status: 200,
      body: session
    };

  } catch (error) {
    appInsights.defaultClient.trackException({
      exception: new Error("Create checkout session failed"), properties: { body: req.body, api: "Checkout" }
    });
    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createCheckoutSession;