import React from "react";
import { createHashRouter, RouterProvider, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Layout from "./pages/Layout";
import Details from "./pages/Details";
import FourZeroFourNotFound from "./components/404NotFound";
import { FilterProvider } from "./context/FilterContext";
import { inventoryLoader } from "./services/inventoryLoader";

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
