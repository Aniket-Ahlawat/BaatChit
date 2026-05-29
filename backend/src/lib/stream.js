import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = (process.env.STREAM_API_KEY || "").trim();
const apiSecret = (process.env.STREAM_API_SECRET || "").trim();

if (!apiKey || !apiSecret) {
    throw new Error("Stream API key or secret is missing");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);
export const streamApiKey = apiKey;

export const upsertStreamUser = async (userData) => {
    try {
        await streamClient.upsertUser({
            id: userData.id,
            name: userData.name,
            image: userData.image,
        });
        return userData;
    } catch (error) {
        console.error("Error creating Stream user", error);
        throw error;
    }
};

export const generateStreamToken = (userId) => {
    return streamClient.createToken(userId);
};
