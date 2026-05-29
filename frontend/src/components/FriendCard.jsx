import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { normalizeAvatarUrl } from "../lib/utils";

const FriendCard = ({ friend, onBlock, isBlocking, isBlocked }) => {
  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12">
            <img src={normalizeAvatarUrl(friend.profilePic, friend._id || friend.id || "friend")} alt={friend.fullName} />
          </div>
          <h3 className="font-semibold truncate">{friend.fullName}</h3>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {friend.nativeLanguage}
          </span>
          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {friend.learningLanguage}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {isBlocked ? (
            <button type="button" className="btn btn-outline w-full btn-disabled" disabled>
              Messaging blocked
            </button>
          ) : (
            <Link to={`/chat/${friend._id}`} className="btn btn-outline w-full">
              Message
            </Link>
          )}
          {onBlock && (
            <button
              type="button"
              className="btn btn-error btn-outline w-full"
              onClick={() => onBlock(friend._id)}
              disabled={isBlocking}
            >
              {isBlocking ? "Blocking..." : "Block"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default FriendCard;

export function getLanguageFlag(language) {
  if (!language) return null;

  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}