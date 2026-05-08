import React from "react";
import { StyleSheet, View } from "react-native";

import { BotonDireccional } from "../contenidos/BotonDireccional";

import { BotonDeSalto } from "../contenidos/BotonDeSalto";

export function ContenedorDeGamepad({
  alMover,
}) {
  return (
    <View style={estilos.gamepad}>
      <View style={estilos.panelDireccional}>
        <BotonDireccional
          simbolo="◀"
          alPresionar={() => alMover(-1, 0)}
          alSoltar={() => alMover(0, 0)}
        />

        <BotonDireccional
          simbolo="▶"
          alPresionar={() => alMover(1, 0)}
          alSoltar={() => alMover(0, 0)}
        />
      </View>

      <BotonDeSalto
        alPresionar={() => alMover(0, -1)}
        alSoltar={() => alMover(0, 0)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  gamepad: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 50,
  },

  panelDireccional: {
    flexDirection: "row",
    gap: 15,
  },
});