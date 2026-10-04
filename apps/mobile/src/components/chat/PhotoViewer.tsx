import { useState } from "react";
import { Dimensions, FlatList, Modal, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";
import type { Attachment } from "@shared/chat";
import { Text } from "../ui";
import { t } from "@shared/i18n";

/** Full-screen photos, swipe between them. */
export function PhotoViewer({ photos, index, onClose }: { photos: Attachment[]; index: number | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");
  const [at, setAt] = useState(index ?? 0);
  if (index === null) return null;
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(e) => setAt(Math.round(e.nativeEvent.contentOffset.x / width))}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
              {item.url ? <Image source={{ uri: item.url }} style={{ width, height: height * 0.8 }} contentFit="contain" /> : <Text style={{ color: "#fff" }}>{t("Photo not kept on this phone")}</Text>}
            </View>
          )}
        />
        <View style={{ position: "absolute", top: insets.top + 8, left: insets.left + 16, right: insets.right + 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text variant="subhead" style={{ color: "#fff" }}>
            {photos.length > 1 ? `${at + 1} of ${photos.length}` : ""}
          </Text>
          <Pressable onPress={onClose} accessibilityLabel={t("Close photo")} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
            <X size={20} color="#fff" weight="bold" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
