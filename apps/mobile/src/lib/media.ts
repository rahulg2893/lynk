import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";
import { newId, type Attachment } from "@shared/chat";

/** A square profile photo, small enough to keep inside the encrypted database. */
export async function pickProfilePhoto(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
  const a = res.canceled ? null : res.assets?.[0];
  return a?.base64 ? `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}` : null;
}

const mediaDir = () => {
  const d = new Directory(Paths.document, "media");
  if (!d.exists) d.create();
  return d;
};

/** Keep a picked file in the app's own storage, since the picker's copy can be cleared. */
function keep(uri: string, ext: string) {
  try {
    const dest = new File(mediaDir(), `${newId("f")}.${ext}`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

function toAttachment(a: ImagePicker.ImagePickerAsset): Attachment {
  const ext = (a.fileName?.split(".").pop() ?? a.mimeType?.split("/")[1] ?? "jpg").toLowerCase();
  return {
    id: newId("a"),
    kind: "image",
    name: a.fileName ?? "Photo",
    size: a.fileSize ?? 0,
    mime: a.mimeType ?? "image/jpeg",
    url: keep(a.uri, ext),
    width: a.width,
    height: a.height,
  };
}

export async function pickPhotos(): Promise<Attachment[]> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.8 });
  return res.canceled ? [] : (res.assets ?? []).map(toAttachment);
}

export async function takePhoto(): Promise<Attachment[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return [];
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
  return res.canceled ? [] : (res.assets ?? []).map(toAttachment);
}

/** Move a finished recording out of the cache into the app's storage. */
export const keepRecording = (uri: string) => keep(uri, uri.split(".").pop() ?? "m4a");
