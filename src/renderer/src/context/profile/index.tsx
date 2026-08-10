import { Profile } from "@/common/schemas";
import { defaultProfile } from "@/common/util";
import React, { createContext, useEffect, useState } from "react";

export interface ProfileContextType {
  profile: Profile;
  changeProfile: (name: string) => void;
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

    window.api.onGetProfile((response) => {
      let profileToApply = defaultProfile;
      let profilesToApply = [
        { name: "Default", file: "default.json", active: true },
      ];
      if (response.success && response.profile) {
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
    });

    window.api.getProfile();
  }, []);

  const changeProfile = (name: string) => {
    if (!profiles.find((p) => p.name === name)) return;
    window.api.setProfile(name);
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
