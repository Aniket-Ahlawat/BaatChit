export const capitialize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const LEGACY_AVATAR_HOST = "avatar.iran.liara.run/public/";

export const buildAvatarUrl = (seed) => `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(seed)}`;

export const normalizeAvatarUrl = (url, fallbackSeed = "user") => {
	if (!url || typeof url !== "string") {
		return buildAvatarUrl(fallbackSeed);
	}

	if (url.includes(LEGACY_AVATAR_HOST)) {
		const legacyId = url.split(LEGACY_AVATAR_HOST)[1]?.replace(".png", "") || fallbackSeed;
		return buildAvatarUrl(legacyId);
	}

	return url;
};

export const normalizeUserAvatar = (user) => {
	if (!user) return user;

	return {
		...user,
		profilePic: normalizeAvatarUrl(user.profilePic, user._id || user.id || user.fullName || "user"),
	};
};