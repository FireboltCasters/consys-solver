import Range from "../domains/Range";


test("RangeTest", () => {
  expect(new Range(0, 10, 2).getValues())
    .toStrictEqual([0, 2, 4, 6, 8, 10]);
});
