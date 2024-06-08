import { getDatabaseContainer } from "../utils/database";

export const deleteEstimateComments = async (estimateId: string) => {
    //Get the database connection
    const container = await getDatabaseContainer("EstimateComments");

    //Fetch the estimate comments for the estimate
    const querySpec = {
        query: "SELECT * FROM c WHERE c.estimateId = @estimateId",
        parameters: [
            {
                name: "@estimateId",
                value: estimateId
            }
        ]
    };

    // Fetch the estimates
    const { resources: fetchedEstimateComments } = await container.items.query(querySpec).fetchAll();

    //Delete the estimate comments
    for (const comment of fetchedEstimateComments) {
        await container.item(comment.id, undefined).delete();
    }
}