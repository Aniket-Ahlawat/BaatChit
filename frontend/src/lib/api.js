import { axiosInstance } from "./axios";
import { normalizeAvatarUrl, normalizeUserAvatar } from "./utils";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return {
      ...res.data,
      user: normalizeUserAvatar(res.data?.user),
    };
  } catch (error) {
    // 401 is expected for logged-out users during initial auth check.
    if (error?.response?.status !== 401) {
      console.error("Error in getAuthUser:", error);
    }
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return {
    ...response.data,
    user: normalizeUserAvatar(response.data?.user),
  };
};

export const updateProfile = async (userData) => {
  const response = await axiosInstance.put("/users/profile", userData);
  return {
    ...response.data,
    user: normalizeUserAvatar(response.data?.user),
  };
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return (response.data || []).map((friend) => normalizeUserAvatar(friend));
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return (response.data || []).map((user) => normalizeUserAvatar(user));
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return (response.data || []).map((request) => ({
    ...request,
    recipient: normalizeUserAvatar(request.recipient),
  }));
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return {
    ...response.data,
    incomingReqs: (response.data?.incomingReqs || []).map((request) => ({
      ...request,
      sender: normalizeUserAvatar(request.sender),
    })),
    acceptedReqs: (response.data?.acceptedReqs || []).map((request) => ({
      ...request,
      recipient: normalizeUserAvatar(request.recipient),
    })),
  };
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

export async function getChatAccessStatus(userId) {
  const response = await axiosInstance.get(`/chat/access/${userId}`);
  return response.data;
}

export async function getBlockedUsers() {
  const response = await axiosInstance.get("/users/blocked");
  return (response.data || []).map((user) => normalizeUserAvatar(user));
}

export async function blockUser(userId) {
  const response = await axiosInstance.post(`/users/block/${userId}`);
  return response.data;
}

export async function unblockUser(userId) {
  const response = await axiosInstance.post(`/users/unblock/${userId}`);
  return response.data;
}