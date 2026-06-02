import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getBlockedUsers, unblockUser } from "../lib/api";
import { ShieldBanIcon } from "lucide-react";
import { normalizeAvatarUrl } from "../lib/utils";
import toast from "react-hot-toast";

const BlockedUsersPage = () => {
  const queryClient = useQueryClient();
  const [unblockingUserId, setUnblockingUserId] = useState(null);

  const { data: blockedUsers = [], isLoading } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: getBlockedUsers,
  });

  const { mutate: unblockUserMutation } = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      setUnblockingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      toast.success("User unblocked!");
    },
    onError: () => setUnblockingUserId(null),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <ShieldBanIcon className="size-7 text-error" />
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Blocked Users</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="card bg-base-200 p-8 text-center">
            <ShieldBanIcon className="size-12 opacity-30 mx-auto mb-3" />
            <p className="font-semibold text-lg">No blocked users</p>
            <p className="opacity-60 text-sm mt-1">Users you block will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((user) => (
              <div
                key={user._id}
                className="card bg-base-200 border border-base-300"
              >
                <div className="card-body p-4 flex flex-row items-center gap-4">
                  <div className="avatar">
                    <div className="w-12 rounded-full">
                      <img
                        src={normalizeAvatarUrl(user.profilePic, user._id || "user")}
                        alt={user.fullName}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{user.fullName}</p>
                    <p className="text-xs opacity-60">Blocked</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => {
                      setUnblockingUserId(user._id);
                      unblockUserMutation(user._id);
                    }}
                    disabled={unblockingUserId === user._id}
                  >
                    {unblockingUserId === user._id ? "Unblocking..." : "✓ Unblock"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedUsersPage;
