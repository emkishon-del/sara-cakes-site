/* Small text helpers shared by the pages (build time) and the browser scripts. */

/* "עבודה אחת" / "2 עבודות" – Hebrew doesn't say "1 עבודות" */
export const worksCount = (n: number) => (n === 1 ? 'עבודה אחת' : `${n} עבודות`);

/* JSON placed inside a <script> tag. "<" is escaped so a title such as "</script>" can't end the tag early. */
export const scriptJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');
