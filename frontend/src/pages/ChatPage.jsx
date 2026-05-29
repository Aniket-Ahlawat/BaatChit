import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getChatAccessStatus, getStreamToken } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import ChatLoader      from "../components/ChatLoader";
import CallButton      from "../components/CallButton";
import MoodPicker      from "../components/MoodPicker";
import MoodMessage     from "../components/MoodMessage";
import { normalizeAvatarUrl } from "../lib/utils";
import { TranslateProvider, LANGUAGES, useTranslateContext } from "../context/TranslateContext";

let sharedChatClient = null;
let sharedChatUserId = null;

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient,        setChatClient]        = useState(null);
  const [channel,           setChannel]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [selectedMood,      setSelectedMood]      = useState(null);

  const isConnectingRef   = useRef(false);
  const activeClientRef   = useRef(null);
  const activeChannelRef  = useRef(null);

  const { authUser }    = useAuthUser();
  const queryClient     = useQueryClient();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn:  getStreamToken,
    enabled:  !!authUser,
  });

  const { data: chatAccess, isLoading: checkingAccess } = useQuery({
    queryKey:              ["chatAccess", targetUserId],
    queryFn:               () => getChatAccessStatus(targetUserId),
    enabled:               !!authUser && !!targetUserId,
    refetchInterval:       3000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus:  true,
  });

  const rewriteLegacyAvatarUrls = (currChannel) => {
    Object.values(currChannel?.state?.members || {}).forEach((member) => {
      if (member?.user) {
        member.user.image = normalizeAvatarUrl(
          member.user.image,
          member.user.id || member.user.name || "member"
        );
      }
    });
    (currChannel?.state?.messages || []).forEach((message) => {
      if (message?.user) {
        message.user.image = normalizeAvatarUrl(
          message.user.image,
          message.user.id || message.user.name || "message-user"
        );
      }
    });
  };

  useEffect(() => {
    if (chatAccess && !chatAccess.canMessage) {
      const channelToStop      = activeChannelRef.current;
      const clientToDisconnect = sharedChatClient;
      if (channelToStop)      channelToStop.stopWatching?.().catch(() => {});
      if (clientToDisconnect) {
        clientToDisconnect.disconnectUser().catch(() => {});
        sharedChatClient  = null;
        sharedChatUserId  = null;
      }
      activeChannelRef.current = null;
      activeClientRef.current  = null;
      setChannel(null);
      setChatClient(null);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const initChat = async () => {
      if (!tokenData?.token || !tokenData?.apiKey || !authUser || !targetUserId) {
        setLoading(false);
        return;
      }
      if (chatAccess && !chatAccess.canMessage) { setLoading(false); return; }
      if (checkingAccess)                        { setLoading(false); return; }

      const streamUserId       = (authUser?._id || authUser?.id)?.toString();
      const streamUserName     = (authUser?.fullName || "").trim() || "User";
      const streamTargetUserId = targetUserId?.toString();

      if (!streamUserId || !streamTargetUserId) {
        setLoading(false);
        toast.error("Missing user details. Please log in again.");
        return;
      }

      if (isConnectingRef.current) return;
      isConnectingRef.current = true;
      setLoading(true);
      setChannel(null);
      setChatClient(null);

      try {
        if (sharedChatClient && sharedChatUserId && sharedChatUserId !== streamUserId) {
          await sharedChatClient.disconnectUser();
          sharedChatClient = null;
          sharedChatUserId = null;
        }
        if (!sharedChatClient) sharedChatClient = new StreamChat(tokenData.apiKey, { timeout: 6000 });

        const client = sharedChatClient;
        if (!client.userID) {
          await client.connectUser(
            {
              id:    streamUserId,
              name:  streamUserName,
              image: normalizeAvatarUrl(authUser.profilePic, streamUserId),
            },
            tokenData.token
          );
        }
        sharedChatUserId = streamUserId;

        const channelId   = [streamUserId, streamTargetUserId].sort().join("-");
        const currChannel = client.channel("messaging", channelId, {
          members: [streamUserId, streamTargetUserId],
        });

        await currChannel.watch();
        rewriteLegacyAvatarUrls(currChannel);

        if (isCancelled) {
          await client.disconnectUser();
          sharedChatClient = null;
          sharedChatUserId = null;
          return;
        }

        activeClientRef.current  = client;
        activeChannelRef.current = currChannel;
        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        isConnectingRef.current = false;
        setLoading(false);
      }
    };

    initChat();

    return () => {
      isCancelled = true;
      const channelToStop      = activeChannelRef.current;
      const clientToDisconnect = sharedChatClient;
      if (channelToStop)      channelToStop.stopWatching?.().catch(() => {});
      if (clientToDisconnect) {
        clientToDisconnect.disconnectUser().catch(() => {});
        sharedChatClient = null;
        sharedChatUserId = null;
        queryClient.removeQueries({ queryKey: ["streamToken"] });
      }
      activeChannelRef.current = null;
      activeClientRef.current  = null;
    };
  }, [
    tokenData?.token,
    tokenData?.apiKey,
    authUser?._id,
    authUser?.fullName,
    authUser?.profilePic,
    targetUserId,
    chatAccess,
    checkingAccess,
  ]);

  /* ─── Video call ─── */
  const navigate = useNavigate();

  const handleVideoCall = () => {
    if (!channel) return;
    // Generate a unique call ID every time so old links never work
    const uniqueCallId = `${channel.id}-${Date.now()}`;
    const callUrl = `${window.location.origin}/call/${uniqueCallId}`;
    // Send invite to the other person
    channel.sendMessage({
      text: `📹 I started a video call! Join here: ${callUrl}\n⏰ This link expires when the call ends.`,
    });
    // Navigate caller directly into the call
    navigate(`/call/${uniqueCallId}`);
  };

  /* ─── Send message with mood ─── */
  const handleSendMessage = async (message) => {
    if (!channel) return;
    try {
      await channel.sendMessage({
        text:        message.text || "",
        attachments: message.attachments || [],
        ...(message.parent?.id              ? { parent_id:         message.parent.id }            : {}),
        ...(message.quoted_message?.id      ? { quoted_message_id: message.quoted_message.id }    : {}),
        // Only attach mood to top-level messages (not thread replies)
        ...(!message.parent && selectedMood ? { mood: selectedMood }                              : {}),
      });
      if (!message.parent) setSelectedMood(null);
    } catch (err) {
      console.error("Send error:", err);
      toast.error("Failed to send message");
    }
  };

  /* ─── Guards ─── */
  if (checkingAccess || loading) return <ChatLoader />;

  if (chatAccess && !chatAccess.canMessage) {
    return (
      <div className="h-[93vh] flex items-center justify-center p-6">
        <div className="card bg-base-200 border border-base-300 max-w-md w-full">
          <div className="card-body text-center">
            <h2 className="text-xl font-semibold">Messaging unavailable</h2>
            <p className="opacity-70">
              This chat is blocked. Unblock the user from the sidebar to message again.
            </p>
            <Link to="/" className="btn btn-primary mt-2">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!chatClient || !channel) return <ChatLoader />;

  return (
    <TranslateProvider>
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden">
      <Chat client={chatClient}>
        {/* Pass custom Message renderer to Channel */}
        <Channel channel={channel} Message={MoodMessage}>
          <div className="w-full h-full relative flex flex-col">
            <CallButton handleVideoCall={handleVideoCall} />

            <Window className="h-full flex flex-col flex-1 overflow-hidden">
              <ChannelHeader />
              <MessageList />

              {/* Custom bottom area: mood + translate + input */}
              <div className="expressiveness-input-area">
                {/* Toolbar row */}
                <div className="expr-toolbar">
                  <MoodPicker selectedMood={selectedMood} onMoodSelect={setSelectedMood} />

                  {/* Language selector for translation */}
                  <LangSelector />

                  {selectedMood && (
                    <span className="expr-mood-badge">
                      Mood active — messages will glow ✨
                    </span>
                  )}
                </div>

                {/* Stream Chat text input */}
                <MessageInput focus overrideSubmitHandler={handleSendMessage} />
              </div>
            </Window>

            <Thread />
          </div>
        </Channel>
      </Chat>
    </div>
    </TranslateProvider>
  );
};
/* ── Language selector — must be inside TranslateProvider ── */
const LangSelector = () => {
  const { targetLang, setTargetLang } = useTranslateContext();
  return (
    <div className="translate-lang-wrapper" title="Translate messages to this language">
      <span className="translate-lang-icon">🌐</span>
      <select
        className="translate-lang-select"
        value={targetLang}
        onChange={(e) => setTargetLang(e.target.value)}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
};

export default ChatPage;