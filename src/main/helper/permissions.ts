import { Permissions } from "@/common/schemas";
import { UserData } from "@/common/types";

/**
 * Whether a chat user may use a feature (TTS, music requests) under its
 * permission settings.
 */
export function hasPermission(permissions: Permissions, user: UserData) {
  if (permissions.all) return true;

  const { list, level } = permissions;
  if (list.enabled) {
    const whitelisted =
      list.white.length === 0 || list.white.includes(user.handle);
    return whitelisted && !list.black.includes(user.handle);
  }

  // [role required, user has it]
  const roles: [boolean, boolean][] = [
    [permissions.followers, Boolean(user.follower)],
    [permissions.moderators, Boolean(user.moderator)],
    [permissions.superfans, Boolean(user.superfan)],
    [level.enabled, (user.fanLevel ?? 0) >= level.value],
  ];
  const required = roles.filter(([needed]) => needed);

  // No role required means everyone passes.
  return required.length === 0 || required.some(([, has]) => has);
}
