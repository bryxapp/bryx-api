import { Context, HttpRequest } from "@azure/functions";
import Stripe from 'stripe';
import { AuthType } from "../utils/security";
import { getOrgInfo, getUserInfo } from "../utils/userInfo";

let appInsights = require('applicationinsights');

const createBillingSession = async (context: Context, req: HttpRequest, decodedToken:AuthType): Promise<void> => {
  try {
    // Initialize the Stripe client
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });

    const userId = decodedToken.sub;
    const orgId = decodedToken.org_id ? decodedToken.org_id : null;
    let stripeCustomerId = null;
    if(orgId) {
      //Get Org Stripe Customer ID
      const org = await getOrgInfo(orgId);
      stripeCustomerId = org.stripeOrgId;
    }
    else{
      //Get User Stripe Customer ID
      const user = await getUserInfo(userId);
      stripeCustomerId = user.stripeUserId;
    }

    // Create a new billing session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${req.headers.origin}/billing-portal?success=true&session_id={CHECKOUT_SESSION_ID}`,
    });

    // Log telemetry
    const telemetryClient = appInsights.defaultClient;
    telemetryClient.trackEvent({
      name: "CreateBillingSession",
      properties: {
        api: "Billing"
      }
    });
    telemetryClient.trackMetric({
      name: "BillingSessionCreated",
      value: 1
    });

    context.res = {
      status: 200,
      body: session
    };
  } catch (error) {
    // Handle errors and log telemetry
    appInsights.defaultClient.trackException({
      exception: new Error("Create billing session failed"),
      properties: { body: req.body, api: "Billing" }
    });

    context.res = {
      status: 500,
      body: error.message
    };
  }
};

export default createBillingSession;