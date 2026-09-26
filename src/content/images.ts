import raccoon from "../assets/images/raccoon.svg";
import mascotDetective from "../assets/images/mascots/detective.png";
import mascotSinger from "../assets/images/mascots/singer.png";
import mascotDancer from "../assets/images/mascots/dancer.png";
import mascotPainter from "../assets/images/mascots/painter.png";
import mascotReader from "../assets/images/mascots/reader.png";

/**
 * Real illustrations, keyed by name and referenced from content JSON via the
 * "image" field. Kept as an explicit registry (rather than raw public paths)
 * so Vite hashes/base-prefixes each asset correctly regardless of deploy path.
 *
 * Source: raccoon.svg is OpenMoji's "raccoon" (U+1F99D), CC BY-SA 4.0,
 * https://openmoji.org/library/emoji-1F99D/ — see README Credits. The
 * mascot-* badges are original character art provided directly by the
 * project owner (one per channel: detective/singer/dancer/painter/reader).
 */
export const contentImages: Record<string, string> = {
  raccoon,
  "mascot-detective": mascotDetective,
  "mascot-singer": mascotSinger,
  "mascot-dancer": mascotDancer,
  "mascot-painter": mascotPainter,
  "mascot-reader": mascotReader,
};
