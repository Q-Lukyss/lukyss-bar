export type AuthUser = {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};
