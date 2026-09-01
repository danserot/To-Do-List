import { storage } from "../platform/storage";
import { cloudRepository, isCloudSyncEnabled } from "./cloudRepository";

const STORAGE_PREFIX = "focus_social_profile_v1";
const COVER_COLORS = ["coral", "teal", "blue", "charcoal"];

const keyFor = (user) => `${STORAGE_PREFIX}:${user.id}`;

const defaultProfile = (user) => ({
  username: user.email?.split("@")[0] || "focus-user",
  bio: "Навожу порядок в делах и двигаюсь к своим целям.",
  cover: "coral",
  avatarImage: "",
  coverImage: "",
});

const normalizeImage = (value) =>
  typeof value === "string" && value.startsWith("data:image/") ? value : "";

const normalize = (user, profile) => ({
  username:
    String(profile.username || defaultProfile(user).username)
      .trim()
      .replace(/^@/, "")
      .replace(/\s+/g, "-")
      .slice(0, 32) || defaultProfile(user).username,
  bio: String(profile.bio || "").trim().slice(0, 160),
  cover: COVER_COLORS.includes(profile.cover) ? profile.cover : "coral",
  avatarImage: normalizeImage(profile.avatarImage),
  coverImage: normalizeImage(profile.coverImage),
});

export const socialProfileRepository = {
  get(user) {
    try {
      const value = storage.getItem(keyFor(user));
      return value ? normalize(user, JSON.parse(value)) : defaultProfile(user);
    } catch {
      return defaultProfile(user);
    }
  },

  save(user, profile) {
    const normalized = normalize(user, profile);
    storage.setItem(keyFor(user), JSON.stringify(normalized));
    return normalized;
  },

  async sync(user) {
    const local = this.get(user);
    if (!isCloudSyncEnabled(user)) return local;

    try {
      const remote = await cloudRepository.getProfile(user);
      if (!remote) {
        await cloudRepository.upsertProfile(user, local);
        return local;
      }
      const synced = normalize(user, {
        ...local,
        username: remote.username,
        bio: remote.bio,
        cover: remote.cover,
      });
      storage.setItem(keyFor(user), JSON.stringify(synced));
      return synced;
    } catch {
      return local;
    }
  },

  async saveCloud(user, profile, fullName = "") {
    if (!isCloudSyncEnabled(user)) return;
    try {
      await cloudRepository.upsertProfile(user, { ...profile, fullName });
    } catch {
      // Local profile remains the source of truth while offline.
    }
  },
};
