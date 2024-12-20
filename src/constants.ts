/**
 * The name of the database used in the application.
 */
export const DB_NAME: string = "social_network";

export enum UserRolesEnum {
  USER = "USER",
  ADMIN = "ADMIN",
}

export const AvailableUserRoles: UserRolesEnum[] = Object.values(UserRolesEnum);

export const USER_TEMPORARY_TOKEN_EXPIRY: number = 20 * 60 * 1000; // 20 minutes
