import * as subscriptionService from "../../services/subscription.service.js";

/**
 * DEV / testing: remove subscription end date so gates use trial credits only.
 */
export const cancelSubscriptionDev = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        reason: "unauthorized",
      });
    }

    await subscriptionService.cancelUserSubscription(userId);

    return res.status(200).json({
      success: true,
      message: "Subscription cleared (dev). freePlansCount unchanged.",
      isSubscribed: false,
      subscriptionEndDate: null,
    });
  } catch (error) {
    console.error("cancelSubscriptionDev:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel subscription",
    });
  }
};

/** Current subscription / trial snapshot for the logged-in user. */
export const getMySubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        reason: "unauthorized",
      });
    }

    const status = await subscriptionService.getSubscriptionStatusForClient(userId);
    if (!status) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        reason: "user_not_found",
      });
    }

    return res.status(200).json({ success: true, ...status });
  } catch (error) {
    console.error("getMySubscriptionStatus:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/** 
 * Mock Checkout: Simulates a successful payment and activates the subscription.
 * Use this from the Frontend to test the UI flow before integrating Stripe.
 */
export const mockCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Call the service to activate the subscription for 30 days
    const result = await subscriptionService.activateUserSubscription(userId, 30);

    return res.status(200).json({
      success: true,
      message: "Payment successful! Subscription activated for 30 days.",
      isSubscribed: result.isSubscribed,
      subscriptionEndDate: result.subscriptionEndDate
    });

  } catch (error) {
    console.error("mockCheckout Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Payment failed to process",
    });
  }
};
