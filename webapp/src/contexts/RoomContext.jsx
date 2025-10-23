import React, { createContext, useState, useContext, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../services/api";

export const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
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

  const fetchSchedules = useCallback(async () => {
    try {
      const response = await api.get('/api/schedules');
      setSchedules(response.data);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Não foi possível carregar os agendamentos.");
    }
  }, []);

  // Função para adicionar uma nova sala
  const addRoom = async (name, room) => {
    const promise = api.post("/api/rooms", { name, room });

    toast.promise(promise, {
      loading: "Adicionando nova sala...",
      success: (response) => {
        fetchRooms(); // Atualiza a lista após o sucesso
        closeForm();
        return "Sala adicionada com sucesso!";
      },
      error: "Erro ao adicionar a sala.",
    });

    return promise; // Retorna a promise para tratamento adicional se necessário
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

  // Função para atualizar os dados de uma sala
 const updateRoom = async (roomId, dataToUpdate) => {
    try {
      const response = await api.put(`/api/rooms/${roomId}`, dataToUpdate);
      fetchRooms(); // Atualiza a lista após o sucesso
      toast.success('Alterações salvas com sucesso!');
      return response;
    } catch (err) {
      // mostra a mensagem de erro retornada pelo backend, quando presente
      const msg = err?.response?.data?.error || err.message || 'Erro ao salvar as alterações.';
      toast.error(msg);
      console.error('Erro ao atualizar sala:', err);
      throw err;
    }
  };

  // Função para deletar uma sala
  const deleteRoom = async (roomId) => {
    const promise = api.delete(`/api/rooms/${roomId}`);

    toast.promise(promise, {
      loading: 'Deletando sala...',
      success: () => {
        setRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));
        return 'Sala deletada com sucesso!';
      },
      error: 'Erro ao deletar a sala.',
    });
    
    return promise;
  };

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);

  const addSchedule = async (scheduleData) => {
    const promise = api.post('/api/schedules', scheduleData);
    toast.promise(promise, {
      loading: 'Criando agendamento...',
      success: () => {
        fetchSchedules(); // Atualiza a lista
        return 'Agendamento criado com sucesso!';
      },
      error: 'Erro ao criar agendamento.',
    });
    return promise;
  };

  const deleteSchedule = async (scheduleId) => {
    const promise = api.delete(`/api/schedules/${scheduleId}`);
    toast.promise(promise, {
      loading: 'Cancelando agendamento...',
      success: () => {
        setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
        return 'Agendamento cancelado!';
      },
      error: 'Erro ao cancelar agendamento.',
    });
    return promise;
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        loading,
        schedules,
        fetchSchedules,
        fetchRooms,
        addRoom,
        sendCommand,
        updateRoom,
        deleteRoom,
        addSchedule,
        deleteSchedule,
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
