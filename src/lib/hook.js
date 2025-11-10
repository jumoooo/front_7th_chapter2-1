// 훅 목록
const hooks = [];
// 훅 순서
let hookIndex = 0;
// 현재 렌더링 할 컴포넌트
let currentComponent = null;
// 렌더링 스케줄링 여부
let renderScheduled = false;
// 현재 컴포넌트 값을 받았는지 확인 여부
let isPrepared = false;

// 버츄얼 돔처럼 Hook 에 의한 render 를 몰아서 한번에 처리
export const scheduleUpdate = () => {
  if (renderScheduled || !currentComponent) return;

  if (!isPrepared) {
    console.warn("prepareRender가 먼저 호출되어야 합니다.");
    return;
  }

  renderScheduled = true;

  Promise.resolve()
    .then(() => {
      renderScheduled = false;
      prepareRender(currentComponent);
      return Promise.resolve(currentComponent());
    })
    .catch((error) => {
      console.error("렌더링 중 오류", error);
    });
};

// useState 훅
export const useState = (initialValue) => {
  // 상태 초기화
  const stateIndex = hookIndex;
  // 훅 꼬이지 않게 초기화
  hooks[stateIndex] = hooks[stateIndex] ?? initialValue;

  const setState = (nextValue) => {
    const value = typeof nextValue === "function" ? nextValue(hooks[stateIndex]) : nextValue;
    // 동일 값이면 렌더 스킵
    if (Object.is(value, hooks[stateIndex])) return;
    hooks[stateIndex] = value;
    scheduleUpdate();
  };
  hookIndex += 1;
  return [hooks[stateIndex], setState];
};

// render 할 컴포넌트 받아오기, Hook 순서 초기화
export const prepareRender = (component) => {
  currentComponent = component;
  hookIndex = 0;
  isPrepared = true;
};
