import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import { normalizeAvatarUrl } from "../lib/utils";

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const activeClientRef = useRef(null);

  const { authUser, isLoading } = useAuthUser();
  const queryClient = useQueryClient();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    let isCancelled = false;
    let createdClient = null;

    const initCall = async () => {
      if (!authUser || !callId) {
        setIsConnecting(false);
        return;
      }

      if (!tokenData?.token || !tokenData?.apiKey) {
        setIsConnecting(false);
        return;
      }

      try {
        console.log("Initializing Stream video client...");
        setIsConnecting(true);
        setCall(null);
        setClient(null);

        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: normalizeAvatarUrl(authUser.profilePic, authUser._id),
        };

        const videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey: tokenData.apiKey,
          user,
          token: tokenData.token,
          options: { timeout: 10000 },
        });
        createdClient = videoClient;

        const callInstance = videoClient.call("default", callId);

        await callInstance.join({ create: true });

        if (isCancelled) {
          await videoClient.disconnectUser();
          return;
        }

        console.log("Joined call successfully");

        activeClientRef.current = videoClient;
        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();

    return () => {
      isCancelled = true;
      const clientToDisconnect = activeClientRef.current || createdClient;

      if (clientToDisconnect) {
        setCall(null);
        setClient(null);
        activeClientRef.current = null;
        clientToDisconnect.disconnectUser().catch(() => {});
        queryClient.removeQueries({ queryKey: ["streamToken"] });
      }
    };
  }, [tokenData?.token, tokenData?.apiKey, authUser?._id, authUser?.fullName, authUser?.profilePic, callId]);

  if (isLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative">
        {client && call ? (
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const navigate = useNavigate();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      navigate("/");
    }
  }, [callingState, navigate]);

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};

export default CallPage;