/* eslint-disable @typescript-eslint/no-var-requires */
const { getStartUrl } = require('../main');

test('getStartUrl returns a string URL', () => {
  const url = getStartUrl();
  expect(typeof url).toBe('string');
  expect(url.length).toBeGreaterThan(0);
});
