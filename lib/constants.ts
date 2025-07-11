export const AVAILABLE_TEAM_ROLES = [
  'leader',
  'member',
  'manager',
  'developer',
  'designer',
  'qa',
] as const

export const MEMBER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
} as const

export type TeamRole = string
export type MemberStatus = keyof typeof MEMBER_STATUS
