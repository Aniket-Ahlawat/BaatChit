import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { upsertStreamUser } from "../lib/stream.js";

const LEGACY_AVATAR_HOST = "avatar.iran.liara.run/public/";

const normalizeAvatarUrl = (url, fallbackSeed = "user") => {
  if (!url || typeof url !== "string") {
    return `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(fallbackSeed)}`;
  }

  if (url.includes(LEGACY_AVATAR_HOST)) {
    const legacyId = url.split(LEGACY_AVATAR_HOST)[1]?.replace(".png", "") || fallbackSeed;
    return `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(legacyId)}`;
  }

  return url;
};

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;
    const blockedUsers = currentUser.blockedUsers || [];

    const pendingRequests = await FriendRequest.find({
      status: "pending",
      $or: [{ sender: currentUserId }, { recipient: currentUserId }],
    }).select("sender recipient");

    const excludedIds = new Set([
      currentUserId.toString(),
      ...(currentUser.friends || []).map((id) => id.toString()),
      ...blockedUsers.map((id) => id.toString()),
    ]);

    pendingRequests.forEach((request) => {
      const senderId = request.sender?.toString();
      const recipientId = request.recipient?.toString();
      const otherUserId = senderId === currentUserId.toString() ? recipientId : senderId;
      if (otherUserId) excludedIds.add(otherUserId);
    });

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $nin: Array.from(excludedIds) } },
        { blockedUsers: { $ne: currentUserId } }, // exclude users who blocked current user
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const myBlockedUsers = req.user.blockedUsers || [];
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (
      myBlockedUsers.some((id) => id.toString() === recipientId) ||
      recipient.blockedUsers.some((id) => id.toString() === myId)
    ) {
      return res.status(400).json({ message: "Friend request not allowed due to block settings" });
    }

    // check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    const sender = await User.findById(friendRequest.sender).select("blockedUsers");
    const recipient = await User.findById(friendRequest.recipient).select("blockedUsers");

    if (
      sender?.blockedUsers?.some((id) => id.toString() === friendRequest.recipient.toString()) ||
      recipient?.blockedUsers?.some((id) => id.toString() === friendRequest.sender.toString())
    ) {
      return res.status(400).json({ message: "Cannot accept request because one user has blocked the other" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const blockedSet = new Set((req.user.blockedUsers || []).map((id) => id.toString()));

    const incomingReqsRaw = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqsRaw = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    const incomingReqs = incomingReqsRaw.filter(
      (request) => !blockedSet.has(request?.sender?._id?.toString())
    );

    const acceptedReqs = acceptedReqsRaw.filter(
      (request) => !blockedSet.has(request?.recipient?._id?.toString())
    );

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const blockedSet = new Set((req.user.blockedUsers || []).map((id) => id.toString()));

    const outgoingRequestsRaw = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

    const outgoingRequests = outgoingRequestsRaw.filter(
      (request) => !blockedSet.has(request?.recipient?._id?.toString())
    );

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function blockUser(req, res) {
  try {
    const myId = req.user.id;
    const { id: targetUserId } = req.params;

    if (myId === targetUserId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndUpdate(myId, {
      $addToSet: { blockedUsers: targetUserId },
    });

    await FriendRequest.deleteMany({
      $or: [
        { sender: myId, recipient: targetUserId },
        { sender: targetUserId, recipient: myId },
      ],
    });

    res.status(200).json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    console.log("Error in blockUser controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function unblockUser(req, res) {
  try {
    const myId = req.user.id;
    const { id: targetUserId } = req.params;

    await User.findByIdAndUpdate(myId, {
      $pull: { blockedUsers: targetUserId },
    });

    res.status(200).json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.log("Error in unblockUser controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getBlockedUsers(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("blockedUsers")
      .populate("blockedUsers", "fullName profilePic nativeLanguage learningLanguage location");

    res.status(200).json(user?.blockedUsers || []);
  } catch (error) {
    console.log("Error in getBlockedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateMyProfile(req, res) {
  try {
    const userId = req.user.id;
    const { fullName, bio, nativeLanguage, learningLanguage, location, profilePic } = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        nativeLanguage,
        learningLanguage,
        location,
        profilePic: normalizeAvatarUrl(profilePic, userId.toString()),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: normalizeAvatarUrl(updatedUser.profilePic, updatedUser._id.toString()),
      });
    } catch (streamError) {
      console.log("Error syncing Stream user in updateMyProfile:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.log("Error in updateMyProfile controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}