import { storage } from "../platform/storage";
import { cloudRepository, isCloudSyncEnabled } from "./cloudRepository";

const STORAGE_PREFIX = "focus_custom_lists_v1";
const keyFor = (user) => `${STORAGE_PREFIX}:${user.id}`;
const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const normalize = (list) => ({
  id: String(list.id || createId()),
  name: String(list.name || "").trim().slice(0, 40),
  color: ["coral", "green", "blue", "yellow"].includes(list.color)
    ? list.color
    : "coral",
});

const read = (user) => {
  try {
    return JSON.parse(storage.getItem(keyFor(user)) || "[]")
      .map(normalize)
      .filter((list) => list.name);
  } catch {
    return [];
  }
};

const write = (user, lists) => {
  storage.setItem(keyFor(user), JSON.stringify(lists));
  return lists;
};

export const listRepository = {
  list: read,
  create(user, name) {
    const list = normalize({ name });
    return write(user, [...read(user), list]);
  },
  remove(user, id) {
    return write(user, read(user).filter((list) => list.id !== id));
  },
  async sync(user) {
    const local = read(user);
    if (!isCloudSyncEnabled(user)) return local;
    try {
      const remote = await cloudRepository.listCustomLists(user);
      if (!remote.length) {
        await cloudRepository.replaceCustomLists(user, local);
        return local;
      }
      return write(user, remote.map((list) => normalize({ id: list.client_id, name: list.name, color: list.color })));
    } catch {
      return local;
    }
  },
  async saveCloud(user, lists) {
    if (!isCloudSyncEnabled(user)) return;
    try {
      await cloudRepository.replaceCustomLists(user, lists);
    } catch {
      // Lists remain available locally and are retried on the next load.
    }
  },
};
