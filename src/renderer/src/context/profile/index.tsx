import { Profile } from "@/common/schemas";
import { APP_EVENTS } from "@/common/types";
import { defaultProfile } from "@/common/util";
import React, { createContext, useEffect, useState } from "react";

export interface ProfileContextType {
  profile: Profile;
  changeProfile: (file: string) => void;
  profiles: { name: string; active: boolean; file: string }[];
  profileLoading: boolean;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined,
);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [profiles, setProfiles] = useState<
    { name: string; active: boolean; file: string }[]
  >([]);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!window.api) {
      setProfile(defaultProfile);
      setProfiles([{ name: "Default", file: "default.json", active: true }]);
      setProfileLoading(false);
      return;
    }

    const removeGetProfile = window.api.on(
      APP_EVENTS.RES_GET_PROFILE,
      (response) => {
        let profileToApply = defaultProfile;
        let profilesToApply = [
          { name: "Default", file: "default.json", active: true },
        ];
        if (response?.success && response.profile) {
          profileToApply = response.profile;
          profilesToApply = response.profiles;
        } else {
          console.warn(
            "Failed to load profile from main, using default fallback.",
          );
        }
        setProfile(profileToApply);
        setProfiles(profilesToApply);
        setProfileLoading(false);
      },
    );

    window.api.emit(APP_EVENTS.GET_PROFILE);

    return () => {
      removeGetProfile();
    };
  }, []);

  const changeProfile = (file: string) => {
    if (!profiles.find((p) => p.file === file)) return;
    window.api.emit(APP_EVENTS.SET_PROFILE, { file });
  };

  return (
    <ProfileContext.Provider
      value={{ profile, profiles, changeProfile, profileLoading }}
    >
      {profileLoading ? (
        <div style={{ background: "#000", height: "100vh" }} /> // TODO: Handle Load later
      ) : (
        children
      )}
    </ProfileContext.Provider>
  );
}
