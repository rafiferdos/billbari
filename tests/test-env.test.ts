import { expect, it } from "vitest"

// The database tests insert users and payments; they must only ever reach the local file.
it("never points tests at a remote database", () => {
  expect(process.env.TURSO_DATABASE_URL).toBeFalsy()
  expect(process.env.TURSO_AUTH_TOKEN).toBeFalsy()
})
