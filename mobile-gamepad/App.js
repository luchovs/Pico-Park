import React from "react";
import { StyleSheet, View } from "react-native";
import { useKeepAwake } from "expo-keep-awake";

import { useConexionConServidor } from "./hooks/useConexionConServidor";

import { ContenedorDeEstadoDeConexion } from "./componentes/contenedores/ContenedorDeEstadoDeConexion";

import { ContenedorDeGamepad } from "./componentes/contenedores/ContenedorDeGamepad";

export default function App() {
  useKeepAwake();

  const {
    conectado,
    colorDeFondo,
    ipDelServidor,
    cambiarIpDelServidor,
    conectarAlServidor,
    enviarMovimiento,
  } = useConexionConServidor();

  return (
    <View
      style={[
        estilos.contenedorPrincipal,
        { backgroundColor: colorDeFondo },
      ]}
    >
      <ContenedorDeEstadoDeConexion
        conectado={conectado}
        ipDelServidor={ipDelServidor}
        alCambiarIp={cambiarIpDelServidor}
        alConectar={conectarAlServidor}
      />

      <ContenedorDeGamepad
        alMover={enviarMovimiento}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    padding: 20,
  },
});