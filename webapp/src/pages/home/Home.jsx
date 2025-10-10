import React, { useEffect, useContext } from 'react';
import { RoomContext } from '../../contexts/RoomContext'; // Importe o RoomContext
import ACUnit from '../../components/ACUnit/ACUnit';
import styles from './Home.module.css';

export default function Home() {
  // Pega os dados e funções do nosso novo contexto
  const { rooms, loading, fetchRooms, sendCommand } = useContext(RoomContext);

  // Busca as salas do backend quando o componente é montado
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]); // O fetchRooms é envolvido em useCallback, então isso é seguro

  // A nova função para ligar/desligar, que usa o sendCommand do contexto
  const toggleAC = async (room) => {
    const command = room.status === "ligado" ? "desligar" : "ligar";
    // Usamos o deviceId, que agora vem do backend!
    await sendCommand(room.deviceId, command);
    // Idealmente, o backend retornaria o estado atualizado ou usaríamos WebSockets.
    // Por enquanto, vamos refazer o fetch para ver a mudança.
    fetchRooms();
  };

  if (loading) {
    return <div className={styles.container}><p>Carregando salas...</p></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.unitsSection}>
        {rooms.map((sala) => (
          <ACUnit
            key={sala.id} // O id do banco de dados
            roomId={sala.room} // O nome da sala
            status={sala.status}
            temperature={sala.temperature || 24} // Usa a temp do backend ou um padrão
            onToggle={() => toggleAC(sala)} // Passa o objeto sala inteiro
            // onTempChange será refatorado para usar sendCommand também
          />
        ))}
      </div>
    </div>
  );
}