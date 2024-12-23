type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
};

export const cookieOptions: CookieOptions = {
  httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
  secure: process.env.NODE_ENV === "production", // Ensures the cookie is only sent over HTTPS
  sameSite: "strict", // Restricts the cookie from being sent with cross-site requests
  path: "/", // Specifies the path for which the cookie is valid
  maxAge: 60 * 60 * 24, // 1 day in seconds
};
