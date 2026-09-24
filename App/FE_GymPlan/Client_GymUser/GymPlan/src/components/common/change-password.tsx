import { useState } from "react";
import { Modal, Text, View } from "react-native";
import { userApi } from "@/services/user-api";
import { Button, Field, Page, ui, useAction } from "./flow-ui";

export function ChangePassword({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [oldPassword, setOld] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saved, setSaved] = useState(false);
  const action = useAction();
  const close = () => { if (!action.busy) { setOld(""); setPassword(""); setConfirm(""); setSaved(false); action.setError(null); onClose(); } };
  return <Modal visible={visible} animationType="slide" onRequestClose={close}>
    <Page title="Đổi mật khẩu" onBack={close}>
      {saved ? <Text style={ui.accent}>✓ Đã đổi mật khẩu thành công.</Text> : <View style={{ gap: 16 }}>
        <Field label="Mật khẩu hiện tại" value={oldPassword} onChangeText={setOld} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!action.busy} />
        <Field label="Mật khẩu mới (6–255 ký tự)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!action.busy} />
        <Field label="Nhập lại mật khẩu mới" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" autoCorrect={false} editable={!action.busy} />
        {!!action.error && <Text style={ui.error}>{action.error}</Text>}
        <Button title={action.busy ? "Đang lưu…" : "Lưu mật khẩu"} disabled={action.busy} onPress={() => action.run(async () => {
          if (!oldPassword || password.length < 6 || password.length > 255) throw new Error("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới từ 6–255 ký tự.");
          if (password !== confirm) throw new Error("Mật khẩu xác nhận không khớp.");
          await userApi.changePassword(oldPassword, password, confirm);
          setOld(""); setPassword(""); setConfirm(""); setSaved(true);
        })} />
      </View>}
      <Button title="Đóng" secondary disabled={action.busy} onPress={close} />
    </Page>
  </Modal>;
}
