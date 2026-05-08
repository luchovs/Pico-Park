import React from "react";
import { StyleSheet, View } from "react-native";

import { CampoDeTextoParaIpDelServidor } from "../contenidos/CampoDeTextoParaIpDelServidor";

import { BotonParaConectarAlServidor } from "../contenidos/BotonParaConectarAlServidor";

import { IndicadorVisualDeConexion } from "../contenidos/IndicadorVisualDeConexion";

export function ContenedorDeEstadoDeConexion({
  conectado,
  ipDelServidor,
  alCambiarIp,
  alConectar,
}) {
  return (
    <View style={estilos.encabezado}>
      <View style={estilos.filaDeConexion}>
        <CampoDeTextoParaIpDelServidor
          valor={ipDelServidor}
          alCambiarTexto={alCambiarIp}
        />

        <BotonParaConectarAlServidor
          conectado={conectado}
          alPresionar={alConectar}
        />
      </View>

      <IndicadorVisualDeConexion conectado={conectado} />
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: {
    marginTop: 40,
    alignItems: "center",
  },

  filaDeConexion: {
    flexDirection: "row",
    marginBottom: 10,
  },
});