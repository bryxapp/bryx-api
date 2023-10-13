
import Stripe from 'stripe';

export const checkoutSessionCompleted = async (stripe: Stripe, checkoutCompleteObj: Stripe.Event.Data): Promise<void> => {
    //Update subscription to PRO model if not already
    console.log("Checkout Session Completed", checkoutCompleteObj);
}

export const subscriptionUpdated = async (stripe: Stripe, subscriptionUpdated: Stripe.Event.Data): Promise<void> => {
    //Update subscription to PRO model if not already
    console.log("Subscription Updated", subscriptionUpdated);
}

export const subscriptionDeleted = async (stripe: Stripe, subscriptionDeleted: Stripe.Event.Data): Promise<void> => {
    // Downgrade subscription to STARTER 
    console.log("Subscription Deleted", subscriptionDeleted);
}

export const invoicePaid = async (stripe: Stripe, invoicePaid: Stripe.Event.Data): Promise<void> => {
    //Update subscription to PRO model if not already
    console.log("Invoice Paid", invoicePaid);
}

export const invoicePaymentFailed = async (stripe: Stripe, invoicePaymentFailed: Stripe.Event.Data): Promise<void> => {
    // Downgrade subscription to STARTER 
    console.log("Invoice Payment Failed", invoicePaymentFailed);
}




