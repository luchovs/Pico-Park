import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from "react-native";

export function BotonDeSalto({
  alPresionar,
  alSoltar,
}) {
  return (
    <View style={estilos.contenedor}>
      <TouchableOpacity
        style={estilos.boton}
        onPressIn={alPresionar}
        onPressOut={alSoltar}
      >
        <Text style={estilos.textoBoton}>
          A
        </Text>
      </TouchableOpacity>

      <Text style={estilos.etiqueta}>
        SALTO
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: "center",
  },

  boton: {
    width: 100,
    height: 100,
    backgroundColor: "#e74c3c",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "rgba(0,0,0,0.2)",
    elevation: 5,
  },

  textoBoton: {
    fontSize: 40,
    color: "white",
    fontWeight: "bold",
  },

  etiqueta: {
    color: "white",
    marginTop: 5,
    fontWeight: "bold",
  },
});