import { renderDetailPage } from "../pages/DetailPage";
import { HomePageComponent } from "../pages/HomePage";

export const routes = [
  { path: "/", component: HomePageComponent },
  { path: "/products/:id", component: renderDetailPage },
];
