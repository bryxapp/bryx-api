import { ContainerName, getDatabaseContainer } from "./database"
import { getOrgSubscription, getUserSubscription, OrgSubscription, OrgSubscriptionNames, UserSubscription, UserSubscriptionNames } from "./userInfo";

export const checkMaxCounts = async (userId: string, orgId: string, containerName: ContainerName, getMaxCount: (subscription: UserSubscription) => number) => {
    const container = await getDatabaseContainer(containerName);

    let queryString = "SELECT VALUE COUNT(1) FROM c WHERE c.orgId = @orgId";
    if (!orgId) {
        queryString += " AND c.userId = @userId";
    }
    const { resources: countResult } = await container.items
        .query({
            query: queryString,
        })
        .fetchAll();

    const count = countResult[0];
    let subscription;
    if (orgId) {
        subscription = await getOrgSubscription(orgId);
    }
    else {
        subscription = await getUserSubscription(userId);
    }
    const maxCount = getMaxCount(subscription);
    if (count >= maxCount) {
        return true;
    }
    else {
        return false;
    }
}

export const getMaxEstimates = (subscription: UserSubscription|OrgSubscription) => {
    switch (subscription) {
        case null:
        case "":
        case UserSubscriptionNames.STARTER:
            return 10;
        case UserSubscriptionNames.PRO:
        case OrgSubscriptionNames.TEAM:
            return 250; //"UNLIMITED"
        case OrgSubscriptionNames.EXPIRED:
            return 0;
        default:
            return 0;
    }
}

export const getMaxEstimateDrafts = (subscription: UserSubscription|OrgSubscription) => {
    switch (subscription) {
        case null:
        case "":
        case UserSubscriptionNames.STARTER:
        case UserSubscriptionNames.PRO:
        case OrgSubscriptionNames.TEAM:
            return 50; //"UNLIMITED"
        case OrgSubscriptionNames.EXPIRED:
            return 0;
        default:
            return 0;
    }
}

export const getMaxTemplates = (subscription: UserSubscription|OrgSubscription) => {
    switch (subscription) {
        case null:
        case "":
        case UserSubscriptionNames.STARTER:
            return 3;
        case UserSubscriptionNames.PRO:
            return 5;
        case OrgSubscriptionNames.TEAM:
            return 20; //"UNLIMITED"
        case OrgSubscriptionNames.EXPIRED:
            return 0;
        default:
            return 0;
    }
}

export const getMaxUserImages = (subscription: UserSubscription|OrgSubscription) => {
    switch (subscription) {
        case null:
        case "":
        case UserSubscriptionNames.STARTER:
        case UserSubscriptionNames.PRO:
        case OrgSubscriptionNames.TEAM:
            return 10; //"UNLIMITED"
        case OrgSubscriptionNames.EXPIRED:
            return 0;
        default:
            return 0;
    }
}