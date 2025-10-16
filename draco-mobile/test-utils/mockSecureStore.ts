const storage = new Map<string, string>();

export default {
  setItemAsync: async (key: string, value: string) => {
    storage.set(key, value);
    return true;
  },
  getItemAsync: async (key: string) => {
    return storage.get(key) ?? null;
  },
  deleteItemAsync: async (key: string) => {
    storage.delete(key);
    return true;
  }
};
