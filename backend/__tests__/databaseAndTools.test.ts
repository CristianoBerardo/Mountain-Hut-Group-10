import { pool, startServer } from "../connections/PostgreSQL/database";
import { uuidv4 } from "../tools/uuidv4";

describe("Database connection and Tools", () => {
  it("uuidv4 returns a valid uuid string", () => {
    const id = uuidv4();
    expect(typeof id).toBe("string");
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  describe("startServer", () => {
    it("connects to pool and releases client on success", async () => {
      const mockClient = { release: jest.fn() };
      const connectSpy = jest
        .spyOn(pool, "connect")
        .mockResolvedValueOnce(mockClient as never);
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      await startServer();

      expect(connectSpy).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "Connected to PostgreSQL database",
      );

      consoleLogSpy.mockRestore();
      connectSpy.mockRestore();
    });

    it("logs error when pool.connect fails", async () => {
      const dbError = new Error("Connection refused");
      const connectSpy = jest
        .spyOn(pool, "connect")
        .mockRejectedValueOnce(dbError as never);
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await startServer();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error connecting to the database:",
        dbError,
      );

      consoleErrorSpy.mockRestore();
      connectSpy.mockRestore();
    });
  });
});
