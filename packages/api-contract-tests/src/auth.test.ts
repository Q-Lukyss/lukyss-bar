import { describe, expect, it } from "vitest";
import { auth, HttpError } from "@lukyss-bar/api-types";
import { anonConnection, adminConnection } from "./setup.js";

describe("auth", () => {
  it("logs in the seeded admin and returns a usable token", async () => {
    const connection = await adminConnection();

    expect(connection.token).toBeTypeOf("string");
    expect(connection.token!.length).toBeGreaterThan(0);
  });

  it("rejects an incorrect password with a typed HttpError", async () => {
    await expect(
      auth.login(anonConnection(), {
        email: "quentin.lkss@gmail.com",
        password: "wrong-password",
      }),
    ).rejects.toSatisfy((err: unknown) => err instanceof HttpError && err.status === 401);
  });
});
