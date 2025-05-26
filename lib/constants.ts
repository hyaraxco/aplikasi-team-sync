// Team Member Roles
export const TEAM_MEMBER_ROLES = {
  UI_DESIGNER: "UI Designer",
  UX_DESIGNER: "UX Designer",
  GRAPHIC_DESIGNER: "Graphic Designer",
  MOTION_DESIGNER: "Motion Designer",
  FRONTEND_DEVELOPER: "Frontend Developer",
  BACKEND_DEVELOPER: "Backend Developer",
  PROJECT_MANAGER: "Project Manager",
  CONTENT_WRITER: "Content Writer",
} as const;

// Role yang tersedia untuk team member (tidak termasuk admin)
export const AVAILABLE_TEAM_ROLES = [
  TEAM_MEMBER_ROLES.UI_DESIGNER,
  TEAM_MEMBER_ROLES.UX_DESIGNER,
  TEAM_MEMBER_ROLES.GRAPHIC_DESIGNER,
  TEAM_MEMBER_ROLES.MOTION_DESIGNER,
  TEAM_MEMBER_ROLES.FRONTEND_DEVELOPER,
  TEAM_MEMBER_ROLES.BACKEND_DEVELOPER,
  TEAM_MEMBER_ROLES.PROJECT_MANAGER,
  TEAM_MEMBER_ROLES.CONTENT_WRITER,
];

// Member Status
export const MEMBER_STATUS = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  INACTIVE: "Inactive",
} as const;

// User Roles (untuk sistem)
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const; 