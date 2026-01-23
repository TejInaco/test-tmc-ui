export function getDeploymentType(): DeploymentType {
  let TYPE_DEPLOYMENT: DeploymentType = "SERVER_AVAILABLE";

  if (__SERVER_AVAILABLE__) {
    TYPE_DEPLOYMENT = "SERVER_AVAILABLE";
    if (__DEBUG__) {
      console.warn("Deployment for a local backend server");
      console.warn("API base URL:", __API_BASE__);
      console.warn("Vite BASE_URL:", import.meta.env.BASE_URL); // test-tmc-ui/
      console.warn("Catalog Url from env:", __CATALOG_URL__); // TejInaco/example-catalog
    }
  } else if (!__CATALOG_URL__) {
    TYPE_DEPLOYMENT = "TYPE_CATALOG-TMC-UI";
    if (__DEBUG__) {
      console.warn(
        "Deployment for a repository that contains a catalog and will clone the default tmc-ui"
      );
      console.warn(
        "Deployment type set TYPE_CATALOG-TMC-UI because __CATALOG_URL__ is not defined."
      );
      console.warn("Vite BASE_URL:", import.meta.env.BASE_URL);
      console.warn("Catalog Url from env:", __CATALOG_URL__);
    }
  } else {
    TYPE_DEPLOYMENT = "TYPE_TMC-UI-CATALOG";
    if (__DEBUG__) {
      console.warn(
        "Deployment for a tmc-ui that will clone a repository that contains a catalog"
      );
      console.warn(
        "Deployment type set TYPE_TMC-UI-CATALOG because __CATALOG_URL__ is defined."
      );
      console.warn("Vite BASE_URL:", import.meta.env.BASE_URL); // test-tmc-ui/
      console.warn("Catalog Url from env:", __CATALOG_URL__); // TejInaco/example-catalog
    }
  }
  return TYPE_DEPLOYMENT;
}
