import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";

export function BotonDireccional({
  simbolo,
  alPresionar,
  alSoltar,
}) {
  return (
    <TouchableOpacity
      style={estilos.boton}
      onPressIn={alPresionar}
      onPressOut={alSoltar}
    >
      <Text style={estilos.texto}>
        {simbolo}
      </Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  boton: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },

  texto: {
    fontSize: 30,
    color: "white",
  },
});