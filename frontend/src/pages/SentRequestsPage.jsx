import { useQuery } from "@tanstack/react-query";
import { ClockIcon, SendIcon } from "lucide-react";

import { getOutgoingFriendReqs } from "../lib/api";
import { normalizeAvatarUrl } from "../lib/utils";

const SentRequestsPage = () => {
  const { data: outgoingRequests = [], isLoading } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sent Friend Requests</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : outgoingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-full bg-base-300 flex items-center justify-center mb-4">
              <SendIcon className="size-8 text-base-content opacity-40" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No sent requests</h3>
            <p className="text-base-content opacity-70 max-w-md">
              Requests you send to other users will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {outgoingRequests.map((request) => (
              <div
                key={request._id}
                className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="card-body p-4">
                  <div className="flex items-start gap-3">
                    <div className="avatar size-12 rounded-full">
                      <img
                        src={normalizeAvatarUrl(
                          request.recipient.profilePic,
                          request.recipient._id || request.recipient.id || "recipient"
                        )}
                        alt={request.recipient.fullName}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">{request.recipient.fullName}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="badge badge-secondary badge-sm">
                          Native: {request.recipient.nativeLanguage}
                        </span>
                        <span className="badge badge-outline badge-sm">
                          Learning: {request.recipient.learningLanguage}
                        </span>
                      </div>
                      <p className="text-xs flex items-center opacity-70 mt-2">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        Pending
                      </p>
                    </div>

                    <div className="badge badge-warning">Awaiting response</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SentRequestsPage;
