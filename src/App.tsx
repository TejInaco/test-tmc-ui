import React from "react";
import {
  createHashRouter,
  RouterProvider,
  Outlet,
  type LoaderFunctionArgs,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Layout from "./pages/Layout";
import Details from "./pages/Details";
import FourZeroFourNotFound from "./components/404NotFound";
import { FilterProvider } from "./context/FilterContext";

const INVENTORY_TIMEOUT_MS = 500;

async function inventoryLoader({ request }: LoaderFunctionArgs) {
  console.log("Loading inventory from API...");
  console.log("Using API base URL:", __API_BASE__);
  console.log("__BASE_URL__:", __BASE_URL__);
  if (!__API_BASE__) {
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
    const res = await fetch(`${__API_BASE__}/inventory`, {
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

const router = createHashRouter(
  [
    {
      element: (
        <>
          <Navbar />
          <Outlet />
        </>
      ),
      errorElement: (
        <>
          <Navbar />
          <FourZeroFourNotFound error={"Settings not defined"} />
        </>
      ),
      children: [
        {
          index: true,
          element: (
            <FilterProvider>
              <Layout />
            </FilterProvider>
          ),
          loader: inventoryLoader,
          errorElement: <FourZeroFourNotFound error={"Catalog not found"} />,
        },
        {
          path: "details/*",
          element: <Details />,
          errorElement: <FourZeroFourNotFound error={"Details not found"} />,
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <RouterProvider router={router} future={{ v7_startTransition: true }} />
);

export default App;
