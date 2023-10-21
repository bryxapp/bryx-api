
import Stripe from 'stripe';
import { isOrg, isUser } from './util';

export const checkoutSessionCompleted = async (checkoutCompleteSession: Stripe.Checkout.Session): Promise<void> => {
    await upgradeSubscription(checkoutCompleteSession.customer as string);
    console.log("Checkout Session Completed Processed", checkoutCompleteSession);
}

export const subscriptionDeleted = async (subscriptionDeleted: Stripe.Subscription): Promise<void> => {
    await downgradeSubscription(subscriptionDeleted.customer as string);
    console.log("Subscription Deleted Processed", subscriptionDeleted);
}

export const invoicePaid = async (invoicePaid: Stripe.Invoice): Promise<void> => {
    await upgradeSubscription(invoicePaid.customer as string);
    console.log("Invoice Paid", invoicePaid);
}

export const invoicePaymentFailed = async (invoicePaymentFailed: Stripe.Invoice): Promise<void> => {
    await downgradeSubscription(invoicePaymentFailed.customer as string);
    console.log("Invoice Payment Failed", invoicePaymentFailed);
}

const upgradeSubscription = async (stripeCustomerId: string) => {
    if (isOrg(stripeCustomerId)) {
        //Update subscription to TEAM model if not already
    }
    else if (isUser(stripeCustomerId)) {
        //Update subscription to PRO model if not already
    }
    else {
        throw new Error("Customer not found");
    }
}

const downgradeSubscription = async (stripeCustomerId: string) => {
    if (isOrg(stripeCustomerId)) {
        //Set Org to disabled 
    }
    if (isUser(stripeCustomerId)) {
        // Downgrade subscription to STARTER 
    }
    else {
        throw new Error("Customer not found");
    }
}
