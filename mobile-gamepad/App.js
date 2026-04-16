import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { io } from "socket.io-client";

// REEMPLAZA CON LA IP DE TU PC
const SERVER_URL = "http://10.56.2.4:3000";

export default function App() {
  const [socket, setSocket] = useState(null);
  const [myColor, setMyColor] = useState("#ccc");

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on("init", (data) => {
      setMyColor(data.color); // El servidor nos asigna un color
    });

    return () => newSocket.close();
  }, []);

  const sendMove = (x, y) => {
    if (socket) socket.emit("move", { x, y });
  };

  return (
    <View style={[styles.container, { backgroundColor: myColor }]}>
      <Text style={styles.title}>PICO PARK CONTROL</Text>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPressIn={() => sendMove(-1, 0)}
          onPressOut={() => sendMove(0, 0)}
        >
          <Text style={styles.btnText}>◀</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.jumpBtn]}
          onPress={() => sendMove(0, -1)}
        >
          <Text style={styles.btnText}>SALTO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPressIn={() => sendMove(1, 0)}
          onPressOut={() => sendMove(0, 0)}
        >
          <Text style={styles.btnText}>▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 50, color: "white" },
  controls: { flexDirection: "row", gap: 20 },
  button: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  jumpBtn: { backgroundColor: "rgba(0,0,0,0.2)", width: 100 },
  btnText: { fontSize: 20, fontWeight: "bold", color: "white" },
});
