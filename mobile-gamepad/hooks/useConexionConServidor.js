import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { io } from "socket.io-client";

export function useConexionConServidor() {
  const [socketDelJuego, setSocketDelJuego] = useState(null);

  const [ipDelServidor, setIpDelServidor] = useState("10.56.2.10");

  const [conectado, setConectado] = useState(false);

  const [colorDeFondo, setColorDeFondo] = useState("#2c3e50");

  const conectarAlServidor = useCallback(() => {
    if (socketDelJuego) {
      socketDelJuego.disconnect();
    }

    const nuevoSocket = io(`http://${ipDelServidor}:3000`, {
      transports: ["websocket"],
      timeout: 5000,
    });

    nuevoSocket.on("connect", () => {
      setConectado(true);

      nuevoSocket.emit("joinGame");
    });

    nuevoSocket.on("disconnect", () => {
      setConectado(false);
    });

    nuevoSocket.on("connect_error", () => {
      setConectado(false);

      Alert.alert(
        "Error de conexión",
        "No se pudo conectar al servidor"
      );
    });

    nuevoSocket.on("init", (datos) => {
      setColorDeFondo(datos.color);
    });

    setSocketDelJuego(nuevoSocket);
  }, [ipDelServidor, socketDelJuego]);

  const enviarMovimiento = useCallback(
    (ejeX, ejeY) => {
      if (!socketDelJuego || !conectado) {
        return;
      }

      socketDelJuego.emit("move", {
        x: ejeX,
        y: ejeY,
      });
    },
    [socketDelJuego, conectado]
  );

  return {
    conectado,
    colorDeFondo,
    ipDelServidor,
    cambiarIpDelServidor: setIpDelServidor,
    conectarAlServidor,
    enviarMovimiento,
  };
}