export {
  MAGIC_LINK_TTL_MS,
  sendMagicLinkEmail,
  requestMagicLink,
  verifyMagicLink,
  InvalidMagicLinkError,
  type MagicLinkContext,
} from "./magicLink.js";

export { hashPassword, verifyPasswordHash, assertPasswordStrength, WeakPasswordError } from "./password.js";
