import { Context, HttpRequest } from "@azure/functions";
let appInsights = require('applicationinsights');

const createCheckoutSession = async (context: Context, req: HttpRequest): Promise<void> => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // Validate there is a body and the body contains fields priceId
    if (!req.body || !req.body.priceId) {
      context.res = {
        status: 400,
        body: "Please pass a valid priceId in the request body"
      };
      return;
    }
    console.log(process.env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price: req.body.priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/canceled`,
      automatic_tax: {
        enabled: true
      }
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
      status: 303,
      headers: {
        'Location': session.url
      },
      body: ""
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