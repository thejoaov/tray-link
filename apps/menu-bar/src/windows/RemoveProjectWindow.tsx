import React, { useMemo, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  clearPendingProjectRemove,
  confirmPendingProjectRemove,
  getPendingProjectRemove,
} from "../services/removeProjectDialog";
import { WindowsNavigator } from "./index";

export const RemoveProjectWindow = () => {
  const { t } = useTranslation();
  const pending = useMemo(() => getPendingProjectRemove(), []);
  const [deleteFromDisk, setDeleteFromDisk] = useState(
    pending?.deleteFromDiskDefault ?? false,
  );

  const close = () => {
    clearPendingProjectRemove();
    WindowsNavigator.close("RemoveProjectWindow");
  };

  const confirm = () => {
    if (!pending) {
      close();
      return;
    }

    confirmPendingProjectRemove({
      id: pending.id,
      path: pending.path,
      deleteFromDisk,
    });

    close();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("removeProjectTitle")}</Text>
      <Text style={styles.body}>{pending?.name ?? "-"}</Text>

      <View style={styles.switchRow}>
        <Switch value={deleteFromDisk} onValueChange={setDeleteFromDisk} />
        <Text style={styles.switchText}>{t("deleteFilesFromDisk")}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={close}
          style={[styles.button, styles.buttonSecondary]}
        >
          <Text style={styles.buttonText}>{t("cancel")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={confirm}
          style={[styles.button, styles.buttonPrimary]}
        >
          <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
            {t("remove")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  body: {
    fontSize: 14,
    opacity: 0.8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchText: {
    fontSize: 13,
  },
  actions: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  button: {
    minWidth: 88,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  buttonSecondary: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  buttonPrimary: {
    backgroundColor: "#1f6feb",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  buttonTextPrimary: {
    color: "#fff",
  },
});
