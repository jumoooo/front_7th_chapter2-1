// 렌더마다 재사용될 컴포넌트 상태값 목록
const hooks = [];
let hookIndex = 0; // 현재 훅 호출이 위치한 인덱스
let renderScheduled = false; // 렌더 재실행이 예약되었는지 여부
let isPrepared = false; // prepareRender가 호출되어 훅 순서가 초기화되었는지 여부
let currentRunner = null; // 컴포넌트를 실행해 HTML을 반환하는 함수
let pendingRender = null; // 라우터가 전달한 실제 DOM 갱신 함수

export const scheduleUpdate = () => {
  if (renderScheduled || !currentRunner || !pendingRender) return;

  if (!isPrepared) {
    console.warn("prepareRender가 먼저 호출되어야 합니다.");
    return;
  }

  renderScheduled = true;

  Promise.resolve()
    .then(() => {
      renderScheduled = false;
      prepareRender(currentRunner); // 훅 인덱스 초기화
      return pendingRender(); // 라우터에게 “다시 렌더해줘” 요청
    })
    .catch((error) => {
      console.error("렌더링 중 오류", error);
      isPrepared = false;
    });
};

// 상태를 보관하고 setState 호출 시 scheduleUpdate를 트리거하는 기본 훅
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

// 컴포넌트 실행 함수를 등록하고 훅 인덱스를 초기화
export const prepareRender = (runner) => {
  currentRunner = runner;
  hookIndex = 0;
  isPrepared = true;
};

// 라우터가 전달한 컴포넌트 실행 함수와 DOM 갱신 함수를 캐시
export const bindRender = (runner, rerender) => {
  currentRunner = runner;
  pendingRender = rerender;
};
