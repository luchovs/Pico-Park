import React from "react";
import { StyleSheet, TextInput } from "react-native";

export function CampoDeTextoParaIpDelServidor({
  valor,
  alCambiarTexto,
}) {
  return (
    <TextInput
      style={estilos.input}
      placeholder="IP del servidor"
      value={valor}
      onChangeText={alCambiarTexto}
      keyboardType="numeric"
    />
  );
}

const estilos = StyleSheet.create({
  input: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
});