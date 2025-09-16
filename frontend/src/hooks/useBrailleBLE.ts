import { useState, useCallback } from "react";

/**
 * 점자 BLE 디바이스 연결 및 제어 Hook
 */
export function useBrailleBLE() {
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

  const connect = useCallback(async () => {
    try {
      if (!(navigator as any).bluetooth) {
        throw new Error("Bluetooth API를 지원하지 않는 브라우저입니다.");
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: "Braille" },
          { namePrefix: "점자" },
          { services: ["0000180a-0000-1000-8000-00805f9b34fb"] } // Device Information Service
        ],
        optionalServices: ["0000180a-0000-1000-8000-00805f9b34fb"]
      });

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error("GATT 서버 연결에 실패했습니다.");
      }

      // 점자 디스플레이 서비스 (예시 UUID)
      const service = await server.getPrimaryService("0000180a-0000-1000-8000-00805f9b34fb");
      const char = await service.getCharacteristic("00002a29-0000-1000-8000-00805f9b34fb");

      setDevice(device);
      setCharacteristic(char);
      setIsConnected(true);

      device.addEventListener("gattserverdisconnected", () => {
        setIsConnected(false);
        setDevice(null);
        setCharacteristic(null);
      });

    } catch (error) {
      console.error("BLE 연결 실패:", error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setIsConnected(false);
    setDevice(null);
    setCharacteristic(null);
  }, [device]);

  const writePattern = useCallback(async (pattern: number[]) => {
    if (!characteristic || !isConnected) {
      throw new Error("BLE 디바이스가 연결되지 않았습니다.");
    }

    try {
      // 점자 패턴을 바이트 배열로 변환
      const data = new Uint8Array(pattern);
      await characteristic.writeValue(data);
    } catch (error) {
      console.error("점자 패턴 전송 실패:", error);
      throw error;
    }
  }, [characteristic, isConnected]);

  return {
    isConnected,
    connect,
    disconnect,
    writePattern
  };
}

export default useBrailleBLE;
