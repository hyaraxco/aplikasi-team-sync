export const AVAILABLE_TEAM_ROLES = [
  "leader",
  "member",
  "manager",
  "developer",
  "designer",
  "qa",
] as const;

export const MEMBER_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING: "Pending",
} as const;

export type TeamRole = typeof AVAILABLE_TEAM_ROLES[number];
export type MemberStatus = keyof typeof MEMBER_STATUS; 