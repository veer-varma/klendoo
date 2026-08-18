import { PrismaClient } from "../generated/client/index.js";

export { PrismaClient } from "../generated/client/index.js";
export type {
  ClientInteraction,
  PlatformSetting,
  InteractionStatus,
  SchedulingPoll,
  PollSlot,
  PollInvitee,
  PollResponse,
  CalendarEvent,
  PollStatus,
  Plan,
  HostAccount,
  HostStatus,
  TrustEdge,
  TrustEdgeType,
} from "../generated/client/index.js";

let client: PrismaClient | undefined;

/**
 * Shared Prisma client, lazily instantiated so importing this package doesn't
 * require DATABASE_URL to be set (e.g. running unit tests that mock db calls).
 */
export function getDb(): PrismaClient {
  if (!client) {
    client = new PrismaClient();
  }
  return client;
}
