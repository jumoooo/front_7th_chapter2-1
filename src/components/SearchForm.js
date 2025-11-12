import OptionSelect from "./formControls/OptionSelect";
import SearchInput from "./formControls/SearchInput";
import { qtySelectData, sortSelectData } from "../constants/selectData";

const CategoryFillter = (categories, filters, loading = false) => {
  const selectedCategory1 = filters?.category1;
  const hasSecondDepth = selectedCategory1 && categories[selectedCategory1];

  return /*html*/ `
    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600">카테고리:</label>
        <div class="flex items-center gap-1 text-xs text-gray-600">
          <button type="button" data-breadcrumb="reset" class="hover:text-blue-800 hover:underline">전체</button>
          ${
            selectedCategory1
              ? /* html */ `
                <span class="text-gray-400">&gt;</span>
                <button
                  type="button"
                  data-breadcrumb="category1"
                  data-category1="${selectedCategory1}"
                  class="hover:text-blue-800 hover:underline"
                >
                  ${selectedCategory1}
                </button>
              `
              : ""
          }
          ${
            selectedCategory1 && filters?.category2
              ? /* html */ `
                <span class="text-gray-400">&gt;</span>
                <button
                  type="button"
                  data-breadcrumb="category2"
                  data-category1="${selectedCategory1}"
                  data-category2="${filters.category2}"
                  class="hover:text-blue-800 hover:underline"
                >
                  ${filters.category2}
                </button>
              `
              : ""
          }
        </div>
      </div>
      <!-- 1depth 카테고리 -->
      <div class="flex flex-wrap gap-2">
      ${
        loading
          ? `<div class="text-sm text-gray-500 italic">카테고리 로딩 중...</div>`
          : !hasSecondDepth
            ? Object.keys(categories)
                .map(
                  (
                    category1,
                  ) => `<button type="button" data-category1="${category1}" class="category1-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              ${category1}
            </button>`,
                )
                .join("")
            : Object.keys(categories[selectedCategory1] ?? {})
                .map((category2) => {
                  const baseClasses =
                    "category2-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors";
                  const inactiveClasses = "bg-white border-gray-300 text-gray-700 hover:bg-gray-50";
                  const activeClasses = "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200";
                  return `<button type="button" data-category1="${selectedCategory1}" data-category2="${category2}" class="${baseClasses} ${
                    filters?.category2 === category2 ? activeClasses : inactiveClasses
                  }">
              ${category2}
            </button>`;
                })
                .join("") || `<div class="text-sm text-gray-500 italic">하위 카테고리가 없습니다.</div>`
      }
      </div>
    </div>
  `;
};

export const SearchForm = ({ filters, pagination, categories, loading }) => {
  return /*html*/ `
    <!-- 검색 및 필터 -->
    <form data-search-form class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <!-- 검색창 -->
      ${SearchInput(filters?.search ?? "")}
      <!-- 필터 옵션 -->
      <div class="space-y-3">
        <!-- 카테고리 필터 -->
        ${CategoryFillter(categories, filters, loading)}
        <!-- 기존 필터들 -->
        <div class="flex gap-2 items-center justify-between">
          <!-- 페이지당 상품 수 -->
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">개수:</label>
            ${OptionSelect("limit-select", { options: qtySelectData, selected: pagination?.limit })}
          </div>
          <!-- 정렬 -->
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">정렬:</label>  
            ${OptionSelect("sort-select", { options: sortSelectData, selected: filters?.sort })}
          </div>
        </div>
      </div>
    </form>
  `;
};

export default SearchForm;
