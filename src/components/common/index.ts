import * as FB from "./FilterBar";

/**
 * @fileoverview Barrel file for all common components.
 */
export * from "./Loading";
export * from "./ErrorMessage";
export * from "./FilterBar";

/**
 * FilterBar namespace for cleaner composition syntax.
 * Example: <FilterBar.Root>...</FilterBar.Root>
 */
export const FilterBar = {
  Root: FB.FilterBarRoot,
  Section: FB.FilterBarSection,
  Separator: FB.FilterBarSeparator,
  Button: FB.FilterBarButton,
  ToggleItem: FB.FilterBarToggleItem,
  Icon: FB.FilterBarIcon,
  Reset: FB.FilterBarReset,
  Search: FB.FilterBarSearch,
  Count: FB.FilterBarCount,
  Collapsible: FB.FilterBarCollapsible,
};
