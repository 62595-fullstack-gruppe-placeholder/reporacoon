import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("pg", () => {
  const mockPoolQuery = vi.fn();
  const mockPoolConnect = vi.fn();
  const mockPoolOn = vi.fn();

  class Pool {
    query = mockPoolQuery;
    connect = mockPoolConnect;
    on = mockPoolOn;
  }

  return {
    __esModule: true,
    default: { Pool },
    Pool,
    __mocks: {
      mockPoolQuery,
      mockPoolConnect,
      mockPoolOn,
    },
  };
});

import { query, queryOne, withTransaction } from "./remoteDataSource";
import * as pgMock from "pg";

const { mockPoolQuery, mockPoolConnect } = (pgMock as any).__mocks;

let mockClient: { query: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> };

describe("remoteDataSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    mockPoolConnect.mockResolvedValue(mockClient as any);
  });

  test("query returns rows from the pool", async () => {
    const rows = [{ id: 1 }];
    mockPoolQuery.mockResolvedValueOnce({ rows });

    const result = await query("SELECT 1");

    expect(mockPoolQuery).toHaveBeenCalledWith("SELECT 1", undefined);
    expect(result).toEqual(rows);
  });

  test("query throws wrapped database error", async () => {
    const error = { message: "boom", detail: "duplicate", code: "23505" };
    mockPoolQuery.mockRejectedValueOnce(error);

    await expect(query("SELECT 1")).rejects.toThrow(
      "Database query failed: boom (duplicate)",
    );
  });

  test("queryOne returns first row when available", async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const result = await queryOne("SELECT 1");

    expect(mockPoolQuery).toHaveBeenCalledWith("SELECT 1", undefined);
    expect(result).toEqual({ id: 1 });
  });

  test("queryOne returns null when no rows are returned", async () => {
    mockPoolQuery.mockResolvedValueOnce({ rows: [] });

    const result = await queryOne("SELECT 1");

    expect(result).toBeNull();
  });

  test("queryOne uses provided client when passed", async () => {
    const client = { query: vi.fn().mockResolvedValue({ rows: [{ id: 2 }] }) } as any;

    const result = await queryOne("SELECT 1", [1], client);

    expect(client.query).toHaveBeenCalledWith("SELECT 1", [1]);
    expect(result).toEqual({ id: 2 });
  });

  test("withTransaction commits and releases the client", async () => {
    mockClient.query.mockResolvedValue({});

    const result = await withTransaction(async (client) => {
      await client.query("SELECT 1");
      return "ok";
    });

    expect(mockPoolConnect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(mockClient.query).toHaveBeenNthCalledWith(2, "SELECT 1");
    expect(mockClient.query).toHaveBeenNthCalledWith(3, "COMMIT");
    expect(mockClient.release).toHaveBeenCalled();
    expect(result).toBe("ok");
  });

  test("withTransaction rolls back and releases the client when callback throws", async () => {
    mockClient.query.mockResolvedValue({});

    await expect(
      withTransaction(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(mockPoolConnect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
    expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    expect(mockClient.release).toHaveBeenCalled();
  });
});
