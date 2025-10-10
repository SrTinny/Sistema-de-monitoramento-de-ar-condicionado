import React, { useEffect, useContext } from 'react';
import { useRooms } from '../../contexts/RoomContext'; // Usando nosso hook customizado
import ACUnit from '../../components/ACUnit/ACUnit';
import styles from './Home.module.css';

export default function Home() {
  const { rooms, loading, fetchRooms, sendCommand } = useRooms();

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const toggleAC = async (room) => {
    const command = room.status === "ligado" ? "desligar" : "ligar";
    await sendCommand(room.deviceId, command);
    setTimeout(fetchRooms, 500); // Espera meio segundo para o ESP talvez responder
  };

  // Função para mudar a temperatura
  const handleTemperatureChange = async (deviceId, temp) => {
    // Criamos um comando padronizado que o ESP32 poderá entender
    const command = `set_temp:${temp}`;
    await sendCommand(deviceId, command);
    setTimeout(fetchRooms, 500);
  };

  if (loading) {
    return <div className={styles.container}><p>Carregando salas...</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.unitsSection}>
        {rooms.map((sala) => (
          // Note que agora passamos o objeto 'sala' inteiro como prop
          <ACUnit
            key={sala.id}
            room={sala} // Passando o objeto completo 
            onToggle={toggleAC}
            onTempChange={handleTemperatureChange}
          />
        ))}
      </div>
    </div>
  );
}