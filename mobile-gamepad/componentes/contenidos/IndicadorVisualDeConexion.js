import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function IndicadorVisualDeConexion({
  conectado,
}) {
  return (
    <View style={estilos.fila}>
      <View
        style={[
          estilos.led,
          {
            backgroundColor: conectado
              ? "#00FF00"
              : "#FF0000",
          },
        ]}
      />

      <Text style={estilos.texto}>
        {conectado
          ? "VINCULADO"
          : "DESCONECTADO"}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
  },

  led: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "white",
  },

  texto: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});