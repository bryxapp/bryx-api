import { ContainerName, getDatabaseContainer } from "./database"
import { getOrgSubscription, getUserSubscription, Subscription } from "./userInfo";

export const checkMaxCounts = async (userId: string, orgId: string, containerName: ContainerName, getMaxCount: (subscription: Subscription) => number) => {
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

export const getMaxEstimates = (subscription: Subscription) => {
    switch (subscription) {
        case "":
        case "STARTER":
            return 10;
        case "PRO":
        case "TEAM":
        case "ENTERPRISE":
            return 250; //"UNLIMITED"
        default:
            return 0;
    }
}

export const getMaxEstimateDrafts = (subscription: Subscription) => {
    switch (subscription) {
        case "":
        case "STARTER":
        case "PRO":
        case "TEAM":
        case "ENTERPRISE":
            return 50; //"UNLIMITED"
        default:
            return 0;
    }
}

export const getMaxTemplates = (subscription: Subscription) => {
    switch (subscription) {
        case "":
        case "STARTER":
            return 3;
        case "PRO":
            return 5;
        case "TEAM":
        case "ENTERPRISE":
            return 20; //"UNLIMITED"
        default:
            return 0;
    }
}

export const getMaxUserImages = (subscription: Subscription) => {
    switch (subscription) {
        case "":
        case "STARTER":
        case "PRO":
        case "TEAM":
        case "ENTERPRISE":
            return 10; //"UNLIMITED"
        default:
            return 0;
    }
}