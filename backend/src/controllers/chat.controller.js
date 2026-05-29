import { generateStreamToken, streamApiKey, upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";

export async function getStreamToken(req, res) {
  try {
    await upsertStreamUser({
      id: req.user._id.toString(),
      name: req.user.fullName || "User",
      image: req.user.profilePic || "",
    });

    const token = generateStreamToken(req.user.id);

    res.status(200).json({ token, apiKey: streamApiKey });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getChatAccessStatus(req, res) {
  try {
    const myId = req.user.id;
    const { id: targetUserId } = req.params;

    if (!targetUserId) {
      return res.status(400).json({ message: "Target user id is required" });
    }

    if (myId === targetUserId) {
      return res.status(200).json({ canMessage: false, reason: "self-chat-not-allowed" });
    }

    const [me, targetUser] = await Promise.all([
      User.findById(myId).select("blockedUsers"),
      User.findById(targetUserId).select("blockedUsers"),
    ]);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const blockedByMe = (me?.blockedUsers || []).some((id) => id.toString() === targetUserId);

    if (blockedByMe) {
      return res.status(200).json({
        canMessage: false,
        reason: "blocked-by-me",
      });
    }

    res.status(200).json({ canMessage: true });
  } catch (error) {
    console.log("Error in getChatAccessStatus controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}