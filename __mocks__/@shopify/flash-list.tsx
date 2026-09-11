/**
 * @format
 */

// Manual jest mock for @shopify/flash-list, opt-in per test file via
// jest.mock("@shopify/flash-list").
//
// FlashList sizes its viewport off a real onLayout pass, which never fires
// under this project's test renderer, so the real component renders zero
// rows in tests — confirmed by probing it directly (0 rendered Text
// nodes). This replacement ignores virtualization entirely and maps
// `data` straight through `renderItem`, so integration tests can query
// real rendered row content (via getByText/getByTestId) instead of
// reaching into FlashList's internal props.
import React from "react";
import { View } from "react-native";
import type { FlashListProps } from "@shopify/flash-list";

export function FlashList<T>({
  data,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListEmptyComponent,
  ListFooterComponent,
  testID,
}: FlashListProps<T>) {
  const items = data ?? [];

  function renderOptionalComponent(
    Component: FlashListProps<T>["ListHeaderComponent"],
  ): React.ReactNode {
    if (!Component) return null;
    return typeof Component === "function" ? <Component /> : Component;
  }

  if (items.length === 0) {
    return <View testID={testID}>{renderOptionalComponent(ListEmptyComponent)}</View>;
  }

  return (
    <View testID={testID}>
      {renderOptionalComponent(ListHeaderComponent)}
      {items.map((item, index) => (
        <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
          {renderItem?.({ item, index, target: "Cell", extraData: undefined })}
        </React.Fragment>
      ))}
      {renderOptionalComponent(ListFooterComponent)}
    </View>
  );
}
