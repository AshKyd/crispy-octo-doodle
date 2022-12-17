import { full, lastUpdated } from "./fetch.js";
import mockDate from "mockdate";

function fetchMock({ headers }) {
  const oldFetch = global.fetch;
  this.fetchCount = 0;
  beforeAll(() => {
    global.fetch = async (url, options) => {
      this.fetchCount++;
      return { headers: headers || {}, text: async () => "hello" };
    };
  });

  afterAll(() => {
    global.fetch = oldFetch;
  });
}

describe("fetch", () => {
  beforeAll(() => {
    mockDate.set(new Date("1998-01-01"));
  });
  describe("full", () => {
    const mock = new fetchMock({});
    it("should fetch a feed", async () => {
      const url = "http://example.org/updated-recently";
      const feed = await full({ url });
      expect(feed).toEqual({
        lastUpdated: Date.now(),
        url,
        text: "hello",
      });
      expect(mock.fetchCount).toBe(1);
    });
  });
  describe("lastUpdated", () => {
    const mock = new fetchMock({
      headers: { "last-updated": new Date("1998-01-01") },
    });
    it("should fetch a feed the first time", async () => {
      const url = "http://example.org/updated-recently";
      const feed = await lastUpdated({ url });
      expect(feed).toEqual({
        lastUpdated: Date.now(),
        url,
        text: "hello",
      });
      expect(mock.fetchCount).toBe(1);
    });
  });
  describe("lastUpdated", () => {
    const mock = new fetchMock({
      headers: { "last-updated": new Date("1998-01-01") },
    });
    it("should return the previous feed if nothing has been updated on the server", async () => {
      const url = "http://example.org/updated-recently";
      const feed = await lastUpdated({
        url,
        lastUpdated: new Date("2024-01-01"),
        text: "previously updated",
      });
      expect(feed).toEqual({
        lastUpdated: new Date("2024-01-01"),
        url,
        text: "previously updated",
      });
      expect(mock.fetchCount).toBe(1);
    });
  });
});
