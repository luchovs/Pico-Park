import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { io } from "socket.io-client";
import { useKeepAwake } from "expo-keep-awake"; // Evita que se apague la pantalla

export default function App() {
  useKeepAwake(); // Activa el Wake Lock

  const [socket, setSocket] = useState(null);
  const [serverIp, setServerIp] = useState("10.56.2.4"); // IP por defecto
  const [connected, setConnected] = useState(false);
  const [myColor, setMyColor] = useState("#2c3e50");

  const connectToServer = () => {
    if (socket) socket.disconnect();

    const newSocket = io(`http://${serverIp}:3000`, {
      transports: ["websocket"],
      timeout: 5000,
    });

    newSocket.on("connect", () => {
      setConnected(true);
      newSocket.emit("joinGame");
    });

    newSocket.on("disconnect", () => setConnected(false));
    newSocket.on("connect_error", () => {
      setConnected(false);
      Alert.alert("Error", "No se pudo conectar al servidor");
    });

    newSocket.on("init", (data) => setMyColor(data.color));

    setSocket(newSocket);
  };

  const sendMove = useCallback(
    (x, y) => {
      if (socket && connected) {
        socket.emit("move", { x, y });
      }
    },
    [socket, connected],
  );

  return (
    <View style={[styles.container, { backgroundColor: myColor }]}>
      {/* SECCIÓN SUPERIOR: CONFIGURACIÓN Y ESTADO */}
      <View style={styles.header}>
        <View style={styles.ipContainer}>
          <TextInput
            style={styles.input}
            placeholder="IP del Servidor (ej: 192.168.1.15)"
            value={serverIp}
            onChangeText={setServerIp}
            keyboardType="numeric"
          />
          <TouchableOpacity style={styles.connectBtn} onPress={connectToServer}>
            <Text style={styles.connectText}>
              {connected ? "RECONECTAR" : "CONECTAR"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* LED VIRTUAL DE ESTADO */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.led,
              { backgroundColor: connected ? "#00FF00" : "#FF0000" },
            ]}
          />
          <Text style={styles.statusText}>
            {connected ? "VINCULADO" : "DESCONECTADO"}
          </Text>
        </View>
      </View>

      {/* SECCIÓN DE CONTROLES: DISEÑO TIPO GAMEPAD */}
      <View style={styles.gamepad}>
        {/* IZQUIERDA: D-PAD (Movimiento) */}
        <View style={styles.dpad}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPressIn={() => sendMove(-1, 0)}
            onPressOut={() => sendMove(0, 0)}
          >
            <Text style={styles.arrowText}>◀</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPressIn={() => sendMove(1, 0)}
            onPressOut={() => sendMove(0, 0)}
          >
            <Text style={styles.arrowText}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* DERECHA: BOTÓN DE ACCIÓN (Salto) */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.jumpBtn}
            onPressIn={() => sendMove(0, -1)}
            onPressOut={() => sendMove(0, 0)}
          >
            <Text style={styles.jumpText}>A</Text>
          </TouchableOpacity>
          <Text style={styles.labelBtn}>SALTO</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginTop: 40, alignItems: "center" },
  ipContainer: { flexDirection: "row", marginBottom: 10 },
  input: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  connectBtn: {
    backgroundColor: "#34495e",
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
  },
  connectText: { color: "white", fontWeight: "bold" },
  statusRow: { flexDirection: "row", alignItems: "center" },
  led: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "white",
  },
  statusText: { color: "white", fontWeight: "bold", fontSize: 14 },

  gamepad: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 50,
  },
  dpad: { flexDirection: "row", gap: 15 },
  controlBtn: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  arrowText: { fontSize: 30, color: "white" },

  actionContainer: { alignItems: "center" },
  jumpBtn: {
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
  jumpText: { fontSize: 40, color: "white", fontWeight: "bold" },
  labelBtn: { color: "white", marginTop: 5, fontWeight: "bold" },
});
