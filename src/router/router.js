import ErrorPage from "../pages/ErrorPage.js";
import { routes } from "./routes.js";
import { matchPath } from "./routerUtils.js";
import { prepareRender } from "../lib/hook.js";

// 이전 Page 초기화 함수(이벤트 정리 등등)
let activeCleanup = null;
export const renderRoute = async () => {
  const $root = document.getElementById("root");
  if (!$root) return;

  if (typeof activeCleanup === "function") {
    activeCleanup();
    activeCleanup = null;
  }

  const { pathname } = window.location;

  for (const route of routes) {
    const params = matchPath(route.path, pathname);
    if (!params) continue;

    try {
      prepareRender(route.render);
      const { html, init } = await route.render({ params, path: pathname });
      $root.innerHTML = html;
      if (typeof init === "function") {
        activeCleanup = init();
      }
    } catch (error) {
      console.error("라우트 렌더링 실패", error);
      $root.innerHTML = ErrorPage();
    }

    return;
  }

  $root.innerHTML = ErrorPage();
};

export const navigate = (path) => {
  if (window.location.pathname === path) {
    return renderRoute();
  }

  window.history.pushState({}, "", path);
  return renderRoute();
};

window.addEventListener("popstate", () => {
  renderRoute();
});
