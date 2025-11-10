import OptionSelect from "./formControls/OptionSelect";
import SearchInput from "./formControls/SearchInput";
import { qtySelectData, sortSelectData } from "../constants/selectData";

const CategoryFillter = (categorys = [], loading = false) => {
  return /*html*/ `
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600">카테고리:</label>
        <button data-breadcrumb="reset" class="text-xs hover:text-blue-800 hover:underline">전체</button>
        ${categorys
          .map(
            (category) => /*html*/ `
          <span class="text-xs text-gray-500">&gt;</span>
          <button data-breadcrumb="category1" data-category1="${category.category1}" class="text-xs hover:text-blue-800 hover:underline">${category.category1}</button>
        `,
          )
          .join("")}
        <span class="text-xs text-gray-500">&gt;</span>
        <button data-breadcrumb="category1" data-category1="생활/건강" class="text-xs hover:text-blue-800 hover:underline">생활/건강</button>
      </div>
      <!-- 1depth 카테고리 -->
      <div class="flex flex-wrap gap-2">
      ${
        loading
          ? `<div class="text-sm text-gray-500 italic">카테고리 로딩 중...</div>`
          : `<button data-category1="생활/건강" data-category2="생활용품" class="category2-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              생활용품
            </button>`
      }
      </div>
    </div>
  `;
};

export const SearchForm = ({ categorys = [], loading = false }) => {
  return /*html*/ `
    <!-- 검색 및 필터 -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <!-- 검색창 -->
      ${SearchInput()}
      <!-- 필터 옵션 -->
      <div class="space-y-3">
        <!-- 카테고리 필터 -->
        ${CategoryFillter(categorys, loading)}
        <!-- 기존 필터들 -->
        <div class="flex gap-2 items-center justify-between">
          <!-- 페이지당 상품 수 -->
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">개수:</label>
            ${OptionSelect(qtySelectData)}
          </div>
          <!-- 정렬 -->
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">정렬:</label>  
            ${OptionSelect(sortSelectData)}
          </div>
        </div>
      </div>
    </div>
  `;
};

export default SearchForm;
