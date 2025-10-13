import React, { createContext, useState, useContext, useCallback } from "react";
import api from "../services/api";

export const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); // Estado para controlar o formulário

  // Função para buscar todas as salas do backend
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/rooms");
      setRooms(response.data);
    } catch (error) {
      console.error("Erro ao buscar salas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para adicionar uma nova sala (vamos usar no AddRoomForm)
  const addRoom = async (name, room) => {
    try {
      await api.post("/api/rooms", { name, room });
      fetchRooms(); // Após adicionar, busca a lista atualizada
    } catch (error) {
      console.error("Erro ao adicionar sala:", error);
      throw error;
    }
  };

  // Função para enviar um comando para um AC
  const sendCommand = async (deviceId, command) => {
    try {
      await api.post("/api/command", { deviceId, command });
      // Para um feedback instantâneo, poderíamos atualizar o estado local aqui
      // Ou simplesmente esperar o próximo heartbeat do ESP atualizar o status real
      console.log(`Comando '${command}' enviado para ${deviceId}`);
    } catch (error) {
      console.error("Erro ao enviar comando:", error);
    }
  };

  // Função para atualizar os dados de uma sala (se necessário no futuro)
  const updateRoom = async (roomId, dataToUpdate) => {
    try {
      await api.put(`/api/rooms/${roomId}`, dataToUpdate);
      fetchRooms(); // Após atualizar, busca a lista para refletir as mudanças
    } catch (error) {
      console.error("Erro ao atualizar a sala:", error);
      throw error;
    }
  };

  const deleteRoom = async (roomId) => {
    try {
      await api.delete(`/api/rooms/${roomId}`);
      // Após deletar, atualizamos a lista de salas removendo a que foi deletada
      // É mais rápido do que buscar tudo do servidor novamente
      setRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("Erro ao deletar a sala:", error);
      throw error; // Lança o erro para a UI poder tratá-lo
    }
  };

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);

  return (
    <RoomContext.Provider
      value={{
        rooms,
        loading,
        fetchRooms,
        addRoom,
        sendCommand,
        updateRoom,
        deleteRoom,
        isFormOpen,
        openForm,
        closeForm,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

// Hook customizado para facilitar o uso do contexto
export const useRooms = () => {
  return useContext(RoomContext);
};
