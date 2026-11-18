import { describe, expect, it } from "vitest";

import { buildPaginationPageItems, paginationResultRange } from "./pagination-pages";

describe("buildPaginationPageItems", () => {
  it("returns empty when totalPages is 0", () => {
    expect(buildPaginationPageItems(1, 0)).toEqual([]);
  });

  it("shows all pages when totalPages <= 5", () => {
    expect(buildPaginationPageItems(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("shows middle window with ellipses", () => {
    expect(buildPaginationPageItems(5, 20)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 20]);
  });

  it("handles first page", () => {
    expect(buildPaginationPageItems(1, 20)).toEqual([1, 2, "ellipsis", 20]);
  });

  it("handles last page", () => {
    expect(buildPaginationPageItems(20, 20)).toEqual([1, "ellipsis", 19, 20]);
  });
});

describe("paginationResultRange", () => {
  it("returns zeros when total is 0", () => {
    expect(paginationResultRange(1, 10, 0)).toEqual({
      page: 1,
      from: 0,
      to: 0,
      totalPages: 0,
    });
  });

  it("computes from/to on middle page", () => {
    expect(paginationResultRange(3, 10, 55)).toEqual({
      page: 3,
      from: 21,
      to: 30,
      totalPages: 6,
    });
  });
});
