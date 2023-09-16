import { CosmosClient } from "@azure/cosmos";
import config from './config.json';

export type ContainerName = "Estimates"| "EstimateDrafts" | "EstimateComments" | "Templates" | "Users"| "Organizations" | "UserImages";

export const getDatabaseContainer = async (containerName:ContainerName) => {
    //Connect to Cosmos DB
    const endpoint = config.DB.accountEndpoint;
    const key = process.env.COSMOS_DB_KEY;
    const client = new CosmosClient({ endpoint, key });

    //Get the database and container
    const databaseId = config.DB.databaseId;
    const database = client.database(databaseId);
    const container = database.container(containerName);

    return container;
};