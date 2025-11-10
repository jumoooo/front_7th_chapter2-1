import { prepareRender } from "./lib/hook.js";

export const renderComponent = async (component) => {
  // Hook 을 위한 컴포넌트 전달
  prepareRender(component);
  await component();
};
