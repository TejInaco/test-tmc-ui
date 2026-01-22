 import { ensureTrailingSlash, normalizeRelativePathSegment} from "../utils/strings";
 import { REPOSITORY_CATALOG_DEFAULT_FOLDER } from "../utils/constants";

 export async function  fetchDataFromTxT(
      baseUrl: string,
      signal: AbortSignal,
      textFilename: string
    ): Promise<FilterData[]> {
      const folder = ensureTrailingSlash(
        normalizeRelativePathSegment(REPOSITORY_CATALOG_DEFAULT_FOLDER)
      );
      const filename = normalizeRelativePathSegment(textFilename);

      const relativePath = `${normalizeRelativePathSegment(baseUrl)}${folder}${filename}`;
      const url = new URL(
        `/${normalizeRelativePathSegment(relativePath)}`,
        window.location.origin
      );

      const res = await fetch(url.toString(), { signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch data from ${textFilename} (${res.status})`);
      }

      const text = await res.text();

      const data = Array.from(
        new Set(
          text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
        )
      );

      return data.map((valueLine) => ({
        value: valueLine,
        label: valueLine.charAt(0).toUpperCase() + valueLine.slice(1),
        checked: false,
      }));
    };