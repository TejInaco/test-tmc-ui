import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AUTHOR_ENDPOINT,
  MANUFACTURER_ENDPOINT,
  REPOSITORY_ENDPOINT,
} from "../utils/constants";

interface FilterContextType {
  repositories: FilterData[];
  manufacturers: FilterData[];
  authors: FilterData[];
  loading: boolean;
  errorFilters: string | null;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [repositories, setRepositories] = useState<FilterData[]>([]);
  const [manufacturers, setManufacturers] = useState<FilterData[]>([]);
  const [authors, setAuthors] = useState<FilterData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorFilters, setErrorFilters] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFilters = async () => {
      try {
        if (!__API_BASE__) {
          setErrorFilters("Catalog URL not configured");
          return;
        }

        // Parallel fetch all filter options
        const [reposRes, manufacturersRes, authorsRes] = await Promise.all([
          fetch(`${__API_BASE__}/${REPOSITORY_ENDPOINT}`, {
            signal: controller.signal,
          }),
          fetch(`${__API_BASE__}/${MANUFACTURER_ENDPOINT}`, {
            signal: controller.signal,
          }),
          fetch(`${__API_BASE__}/${AUTHOR_ENDPOINT}`, {
            signal: controller.signal,
          }),
        ]);

        if (!reposRes.ok || !manufacturersRes.ok || !authorsRes.ok) {
          setErrorFilters("Failed to fetch filter data");
          return;
        }

        const [reposJson, manufacturersJson, authorsJson] = await Promise.all([
          reposRes.json(),
          manufacturersRes.json(),
          authorsRes.json(),
        ]);

        const nextRepositories: FilterData[] = (reposJson.data || []).map(
          (repo: { name: string }) => ({
            value: repo.name,
            label: repo.name.charAt(0).toUpperCase() + repo.name.slice(1),
            checked: false,
          })
        );

        const nextManufacturers: FilterData[] = (
          manufacturersJson.data || []
        ).map((manufacturer: string) => ({
          value: manufacturer,
          label: manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1),
          checked: false,
        }));

        const nextAuthors: FilterData[] = (authorsJson.data || []).map(
          (author: string) => ({
            value: author,
            label: author.charAt(0).toUpperCase() + author.slice(1),
            checked: false,
          })
        );

        setRepositories(nextRepositories);
        setManufacturers(nextManufacturers);
        setAuthors(nextAuthors);

        if (
          nextRepositories.length === 0 &&
          nextManufacturers.length === 0 &&
          nextAuthors.length === 0
        ) {
          setErrorFilters("No filter data available");
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setErrorFilters(err.message ?? "Unknown error");
          console.error("Error fetching filters:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
    return () => controller.abort();
  }, []);

  return (
    <FilterContext.Provider
      value={{ repositories, manufacturers, authors, loading, errorFilters }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
};
