import ErrorPage from "../pages/ErrorPage.js";
import { routes } from "./routes.js";
import { matchPath } from "./routerUtils.js";
import { prepareRender } from "../lib/hook.js";
import { bindRender } from "../lib/hook.js";

// 현재 화면에서 등록한 이벤트 리스너나 옵저버를 정리하기 위한 함수
let activeCleanup = null;

// 주소창 경로를 라우트 목록과 비교해 맞는 컴포넌트를 찾아 렌더링
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

    const component = route.component ?? route.render;
    if (typeof component !== "function") {
      console.error("라우트에 컴포넌트가 없습니다.", route);
      continue;
    }

    try {
      activeCleanup = await renderComponent(component, { params, path: pathname }, $root);
    } catch (error) {
      console.error("라우트 렌더링 실패", error);
      $root.innerHTML = ErrorPage();
    }
    return;
  }

  $root.innerHTML = ErrorPage();
};

// 주어진 컴포넌트를 실행해 DOM을 갱신하고, cleanup/mount 생명주기를 관리
const renderComponent = async (component, context, $root) => {
  const runner = () => component(context); // 훅들이 사용할 “컴포넌트 실행 함수”
  const rerender = async () => {
    const result = runner();
    const { html, init } = typeof result === "string" ? { html: result } : result;

    if (typeof html !== "string") throw new Error("컴포넌트는 문자열을 반환해야 합니다.");
    if (typeof activeCleanup === "function") activeCleanup();
    $root.innerHTML = html;
    const mountFn = typeof component.mount === "function" ? component.mount : typeof init === "function" ? init : null;
    activeCleanup = typeof mountFn === "function" ? mountFn(context) : null;
    return activeCleanup;
  };

  bindRender(runner, rerender); // 훅 시스템에 현재 runner와 rerender를 등록
  prepareRender(rerender); // 최초 실행을 위한 준비
  return rerender(); // 첫 렌더
};

// history API로 경로를 변경했을 때 새 라우트를 계산해 렌더링
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
