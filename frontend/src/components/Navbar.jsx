import { Link } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, UserCogIcon, MenuIcon, ShipWheelIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { normalizeAvatarUrl } from "../lib/utils";

const Navbar = () => {
  const { authUser } = useAuthUser();
  // const queryClient = useQueryClient();
  // const { mutate: logoutMutation } = useMutation({
  //   mutationFn: logout,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  const { logoutMutation } = useLogout();

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full">
          {/* Mobile Navigation (Logo & Hamburger) - Hidden on large screens */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="dropdown">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                <MenuIcon className="h-6 w-6" />
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/friends">Friends</Link></li>
                <li><Link to="/notifications">Notifications</Link></li>
                <li><Link to="/sent-requests">Sent Requests</Link></li>
                <li><Link to="/profile">Edit Profile</Link></li>
              </ul>
            </div>
            <Link to="/" className="flex items-center gap-1.5">
              <ShipWheelIcon className="size-6 text-primary" />
              <span className="text-xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                BaatChit
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Link to={"/notifications"} className="hidden lg:block">
              <button className="btn btn-ghost btn-circle">
                <BellIcon className="h-5 w-5 text-base-content opacity-70" />
              </button>
            </Link>
            <Link to={"/profile"} className="hidden lg:block">
              <button className="btn btn-ghost btn-circle">
                <UserCogIcon className="h-5 w-5 text-base-content opacity-70" />
              </button>
            </Link>

          {/* TODO */}
          <ThemeSelector />

          <div className="avatar">
            <div className="w-9 rounded-full">
              <img
                src={normalizeAvatarUrl(authUser?.profilePic, authUser?._id || authUser?.id || "user")}
                alt="User Avatar"
                rel="noreferrer"
              />
            </div>
          </div>

          {/* Logout button */}
          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
          </button>
        </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;