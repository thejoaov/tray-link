import React, { useState } from "react";
import { z } from "zod";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { Button, Text, TextInput, View } from "../components";
import { CustomTool } from "common-types";
import Alert from "../modules/Alert";
import { loadPreferences, persistPreferences } from "../services/preferences";

const customToolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  binary: z.string().min(1, "Binary is required"),
  command: z.string().min(1, "Command is required"),
});

export const CustomTerminalWindow = () => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [binary, setBinary] = useState("");
  const [command, setCommand] = useState("");

  const onSave = () => {
    const result = customToolSchema.safeParse({ name, binary, command });
    if (!result.success) {
      Alert.alert(
        t("invalidTerminal"),
        result.error.issues[0]?.message || t("invalidValues"),
      );
      return;
    }

    const preferences = loadPreferences();
    const tool: CustomTool = {
      id: Date.now().toString(),
      name: result.data.name,
      binary: result.data.binary,
      command: result.data.command,
    };

    persistPreferences({
      ...preferences,
      customTerminals: [...preferences.customTerminals, tool],
    });

    Alert.alert(t("saved"), t("customTerminalSaved"));
    setName("");
    setBinary("");
    setCommand("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("customTerminal")}</Text>
      <Text style={styles.label}>{t("name")}</Text>
      <TextInput
        border="default"
        rounded="small"
        px="2"
        py="2"
        value={name}
        onChangeText={setName}
        placeholder="Warp"
      />

      <Text style={styles.label}>{t("binary")}</Text>
      <TextInput
        border="default"
        rounded="small"
        px="2"
        py="2"
        value={binary}
        onChangeText={setBinary}
        placeholder="warp"
      />

      <Text style={styles.label}>{t("openCommandTemplate")}</Text>
      <TextInput
        border="default"
        rounded="small"
        px="2"
        py="2"
        value={command}
        onChangeText={setCommand}
        placeholder="open -a Warp"
      />

      <Button title={t("saveCustomTerminal")} onPress={onSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    opacity: 0.75,
  },
});
