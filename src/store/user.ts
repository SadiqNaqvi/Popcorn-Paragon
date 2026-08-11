import appToast from "@lib/frontend/providers/appToast";
import { calculateAge } from "@lib/shared/utils";
import { localForageStorage } from "@store/utils";
import { CurrentUser, Frame } from "@type/internal";
import { TypedFunction } from "@type/other";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserMetaData = {
  user_id: string;
  username: string;
  profile: Frame | undefined;
};

type UserStore = {
  user: CurrentUser | null;

  // meta will be updated based on the token and session. it is not stored locally instead it is set every time the app mounts
  meta: UserMetaData | null;

  dataSaver: boolean;

  filterContent: boolean;

  setUser: (data: CurrentUser) => void;
  setUserMeta: (meta: UserMetaData) => void;
  clearUser: () => void;
  toggleDataSaver: TypedFunction<boolean>;
  setContentFiltering: TypedFunction<boolean>;

  isHydrated: boolean;
};

const useCurrentUser = create(
  persist(
    (set, get) => ({
      user: null,
      meta: null,
      isHydrated: false,

      dataSaver: false,

      filterContent: true,
      setUser: (user) => set({ user }),
      setUserMeta: (meta) => {
        set({ meta })
      },

      clearUser: () => {
        set({ user: null, meta: null, dataSaver: false, filterContent: true })
      },

      toggleDataSaver: () => set((prev) => ({ dataSaver: !prev.dataSaver })),
      setContentFiltering: (newState) => {
        const dob = get().user?.dob;

        if (!dob) return;

        else if (newState === false && calculateAge(dob) < 18) return;

        set({ filterContent: newState })
      }
    }),
    {
      name: "UserStorage",
      storage: localForageStorage,
      onRehydrateStorage: () => (state) => {
        if (state)
          setTimeout(() => {
            useCurrentUser.setState({ isHydrated: true });
          }, 0);
      },
      partialize: (state: UserStore) => ({
        user: state.user,
      }),
    }
  )
);

export default useCurrentUser;
