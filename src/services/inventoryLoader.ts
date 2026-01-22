import type { LoaderFunctionArgs } from "react-router-dom";
import { INVENTORY_TIMEOUT_MS, INVENTORY_FILENAME, REPOSITORY_CATALOG_DEFAULT_FOLDER } from "../utils/constants";
import { normalizeRelativePathSegment, ensureTrailingSlash } from "../utils/strings";

async function fetchDataFromAPI(
  baseUrl: string | undefined,
  request: Request
): Promise<unknown[]> {
  if (!baseUrl) {
    throw new Response("Catalog URL not configured", { status: 400 });
  }
  const controller = new AbortController();
  let didTimeout = false;

  const timeoutId = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, INVENTORY_TIMEOUT_MS);

  const abortFromRouter = () => controller.abort();
  request.signal.addEventListener("abort", abortFromRouter);

  try {
    const res = await fetch(`${baseUrl}/inventory`, {
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Response("Failed to fetch inventory", { status: res.status });
    }

    const json: unknown = await res.json();
    if (
      typeof json === "object" &&
      json !== null &&
      "data" in json &&
      Array.isArray((json as { data?: unknown }).data)
    ) {
      return (json as { data: unknown[] }).data;
    }

    return [];
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      if (didTimeout) {
        throw new Response("Inventory request timed out", { status: 504 });
      }
      // Aborted due to navigation; let router handle it naturally
      throw err;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    request.signal.removeEventListener("abort", abortFromRouter);
  }
}




async function fetchLocalInventory(baseUrl: string): Promise<unknown[]> {

  const folder = ensureTrailingSlash(normalizeRelativePathSegment(REPOSITORY_CATALOG_DEFAULT_FOLDER));
  const filename = normalizeRelativePathSegment(INVENTORY_FILENAME);

  const relativePath = `${normalizeRelativePathSegment(baseUrl)}${folder}${filename}`;
  const url = new URL(`/${normalizeRelativePathSegment(relativePath)}`, window.location.origin);
  
  console.log("Fetching local inventory from URL:",  url.toString());
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Response("Failed to fetch local inventory", { status: res.status });
  }

  const json: unknown = await res.json();
  console.log("Fetched local inventory JSON:", json);
 
  if (
    typeof json === "object" &&
    json !== null &&
    "data" in json &&
    Array.isArray((json as { data?: Item[] }).data)
  ) {
    console.log("Local inventory loaded:", json);
    return (json as { data: Item[] }).data;
  }

  return [];
}


/**
 * 
 * @param 
 * @returns 
 */
export async function inventoryLoader({ request }: LoaderFunctionArgs) {
  console.warn("Loading inventory from API...");
  console.warn("Using API base URL:", __API_BASE__);
  console.warn("VITE_REPO_URL:", import.meta.env.VITE_REPO_URL);

  console.warn("Vite BASE_URL:", import.meta.env.BASE_URL);

  console.warn("Repo Url from env:", __REPO_URL__ );

  const repositoryCatalogBased: string | undefined = import.meta.env.BASE_URL;

  // if (repositoryCatalogBased) {
  if(true) {  
  const data = fetchLocalInventory(repositoryCatalogBased);
    return data;
    // necessary to read the catalog and files
  } else {
    const data = await fetchDataFromAPI(__API_BASE__, request);
    return data;
  }
}
