import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";

export function BotonParaConectarAlServidor({
  conectado,
  alPresionar,
}) {
  return (
    <TouchableOpacity
      style={estilos.boton}
      onPress={alPresionar}
    >
      <Text style={estilos.texto}>
        {conectado ? "RECONECTAR" : "CONECTAR"}
      </Text>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  boton: {
    backgroundColor: "#34495e",
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
  },

  texto: {
    color: "white",
    fontWeight: "bold",
  },
});