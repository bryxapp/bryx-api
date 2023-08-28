import { CosmosClient } from "@azure/cosmos";
import config from './config.json';

export const getDatabaseContainer = async (containerId:string) => {
    //Connect to Cosmos DB
    const endpoint = config.DB.accountEndpoint;
    const key = process.env.COSMOS_DB_KEY;
    const client = new CosmosClient({ endpoint, key });

    //Get the database and container
    const databaseId = config.DB.databaseId;
    const database = client.database(databaseId);
    const container = database.container(containerId);

    return container;
};