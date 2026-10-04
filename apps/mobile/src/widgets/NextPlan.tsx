import { HStack, Image, Spacer, Text, VStack } from "@expo/ui/swift-ui";
import { containerBackground, font, foregroundStyle, lineLimit, padding, widgetURL } from "@expo/ui/swift-ui/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";

export type NextPlanProps = {
  /** Empty when nothing is planned. */
  title?: string;
  when?: string;
  where?: string;
  going?: number;
  chat?: string;
  chatId?: string;
};

/**
 * Home and Lock Screen widget: the next plan you're part of, or a quiet
 * empty state. Tapping it opens the plan's chat. Widget code runs in the
 * extension, so everything it needs comes in through props.
 */
const NextPlan = (props: NextPlanProps, environment: WidgetEnvironment) => {
  "widget";
  const lockScreen = environment.widgetFamily === "accessoryRectangular";
  if (!props.title) {
    return (
      <VStack alignment="leading" spacing={4} modifiers={[containerBackground({ type: "hierarchical", style: "quaternary" }, "widget"), widgetURL("lynk://")]}>
        <Text modifiers={[font({ textStyle: "headline" })]}>Nothing planned</Text>
        {lockScreen ? null : <Text modifiers={[font({ textStyle: "caption" }), foregroundStyle({ type: "hierarchical", style: "secondary" })]}>Plans you save in Lynk show here.</Text>}
      </VStack>
    );
  }
  if (lockScreen) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[containerBackground({ type: "hierarchical", style: "quaternary" }, "widget"), widgetURL(`lynk://chat/${props.chatId ?? ""}`)]}>
        <Text modifiers={[font({ textStyle: "headline" }), lineLimit(1)]}>{props.title}</Text>
        <Text modifiers={[font({ textStyle: "caption" }), lineLimit(1)]}>{props.when}</Text>
        {props.going ? <Text modifiers={[font({ textStyle: "caption" }), lineLimit(1)]}>{`${props.going} going`}</Text> : null}
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={4} modifiers={[containerBackground({ type: "hierarchical", style: "quaternary" }, "widget"), widgetURL(`lynk://chat/${props.chatId ?? ""}`)]}>
      <HStack spacing={5}>
        <Image systemName="calendar" size={12} color="#0A84FF" />
        <Text modifiers={[font({ textStyle: "caption", weight: "semibold" }), foregroundStyle("#0A84FF")]}>Up next</Text>
      </HStack>
      <Text modifiers={[font({ textStyle: "headline" }), lineLimit(2), padding({ top: 2 })]}>{props.title}</Text>
      <Text modifiers={[font({ textStyle: "subheadline" }), foregroundStyle({ type: "hierarchical", style: "secondary" }), lineLimit(1)]}>{props.when}</Text>
      {props.where ? <Text modifiers={[font({ textStyle: "caption" }), foregroundStyle({ type: "hierarchical", style: "secondary" }), lineLimit(1)]}>{props.where}</Text> : null}
      <Spacer />
      <Text modifiers={[font({ textStyle: "caption", weight: "medium" }), lineLimit(1)]}>
        {props.going ? `${props.going} going · ${props.chat ?? ""}` : (props.chat ?? "")}
      </Text>
    </VStack>
  );
};

export default createWidget("NextPlan", NextPlan);
