import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  HomeIcon,
  SendIcon,
  ShieldBanIcon,
  ShipWheelIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";
import { getBlockedUsers, unblockUser } from "../lib/api";
import { normalizeAvatarUrl } from "../lib/utils";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const location = useLocation();
  const currentPath = location.pathname;

  const { data: blockedUsers = [] } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: getBlockedUsers,
  });

  const { mutate: unblockUserMutation, isPending: isUnblockPending } = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <ShipWheelIcon className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
            BaatChit
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          to="/"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/" ? "btn-active" : ""
          }`}
        >
          <HomeIcon className="size-5 text-base-content opacity-70" />
          <span>Home</span>
        </Link>

        <Link
          to="/friends"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/friends" ? "btn-active" : ""
          }`}
        >
          <UsersIcon className="size-5 text-base-content opacity-70" />
          <span>Friends</span>
        </Link>

        <Link
          to="/notifications"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/notifications" ? "btn-active" : ""
          }`}
        >
          <BellIcon className="size-5 text-base-content opacity-70" />
          <span>Notifications</span>
        </Link>

        <Link
          to="/sent-requests"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/sent-requests" ? "btn-active" : ""
          }`}
        >
          <SendIcon className="size-5 text-base-content opacity-70" />
          <span>Sent Requests</span>
        </Link>

        <Link
          to="/profile"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/profile" ? "btn-active" : ""
          }`}
        >
          <UserCogIcon className="size-5 text-base-content opacity-70" />
          <span>Edit Profile</span>
        </Link>
      </nav>

      <div className="px-4 pb-4">
        <div className="rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldBanIcon className="size-4 opacity-70" />
            <p className="text-sm font-semibold">Blocked Users</p>
          </div>

          {blockedUsers.length === 0 ? (
            <p className="text-xs opacity-60">No blocked users</p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {blockedUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-2">
                  <div className="avatar">
                    <div className="w-7 rounded-full">
                      <img
                        src={normalizeAvatarUrl(user.profilePic, user._id || user.id || "user")}
                        alt={user.fullName}
                      />
                    </div>
                  </div>
                  <p className="text-xs flex-1 truncate">{user.fullName}</p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-success"
                    onClick={() => unblockUserMutation(user._id)}
                    disabled={isUnblockPending}
                  >
                    {isUnblockPending ? "..." : "Unblock"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* USER PROFILE SECTION */}
      <div className="p-4 border-t border-base-300 mt-auto">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img
                src={normalizeAvatarUrl(authUser?.profilePic, authUser?._id || authUser?.id || "user")}
                alt="User Avatar"
              />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{authUser?.fullName}</p>
            <p className="text-xs text-success flex items-center gap-1">
              <span className="size-2 rounded-full bg-success inline-block" />
              Online
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;