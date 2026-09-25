import raccoon from "../assets/images/raccoon.svg";

/**
 * Real illustrations, keyed by name and referenced from content JSON via the
 * "image" field. Kept as an explicit registry (rather than raw public paths)
 * so Vite hashes/base-prefixes each asset correctly regardless of deploy path.
 *
 * Source: raccoon.svg is OpenMoji's "raccoon" (U+1F99D), CC BY-SA 4.0,
 * https://openmoji.org/library/emoji-1F99D/ — see README Credits.
 */
export const contentImages: Record<string, string> = {
  raccoon,
};
