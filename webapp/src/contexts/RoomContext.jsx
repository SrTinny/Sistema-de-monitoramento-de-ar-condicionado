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
  const fetchRooms = useCallback(async (options = {}) => {
    const { silent = false } = options;

    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await api.get("/api/rooms");
      setRooms(response.data);
    } catch (error) {
      console.error("Erro ao buscar salas:", error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
      const response = await api.post("/api/command", { deviceId, command });
      console.log(`Comando '${command}' enviado para ${deviceId}`);
      return response;
    } catch (error) {
      const msg = error?.response?.data?.error || error.message || "Erro ao enviar comando.";
      toast.error(msg);
      console.error("Erro ao enviar comando:", error);
      throw error;
    }
  };

  const startIrLearning = async (roomId, button) => {
    try {
      const response = await api.post(`/api/rooms/${roomId}/ir/learn`, { button });
      toast.success(`Modo de aprendizado iniciado para '${button}'.`);
      fetchRooms();
      return response.data;
    } catch (error) {
      const msg = error?.response?.data?.error || error.message || "Erro ao iniciar aprendizado IR.";
      toast.error(msg);
      throw error;
    }
  };

  const confirmIrLearning = async (roomId, save) => {
    try {
      const response = await api.post(`/api/rooms/${roomId}/ir/learn/confirm`, { save });
      toast.success(response?.data?.message || (save ? 'Sinal IR salvo com sucesso.' : 'Sinal IR descartado.'));
      await fetchRooms();
      return response.data;
    } catch (error) {
      const msg = error?.response?.data?.error || error.message || 'Erro ao confirmar sinal IR.';
      toast.error(msg);
      throw error;
    }
  };

  const cancelIrLearning = async (roomId) => {
    try {
      const response = await api.post(`/api/rooms/${roomId}/ir/learn/cancel`);
      toast.success(response?.data?.message || 'Clonagem IR cancelada.');
      await fetchRooms();
      return response.data;
    } catch (error) {
      const msg = error?.response?.data?.error || error.message || 'Erro ao cancelar clonagem IR.';
      toast.error(msg);
      throw error;
    }
  };

  // Função para alterar setpoint de temperatura
  const setTemperature = async (roomId, temperature) => {
    try {
      const response = await api.post(`/api/ac/${roomId}/setpoint`, { setpoint: temperature });
      fetchRooms(); // Atualiza as salas para refletir o novo setpoint
      toast.success(`Temperatura alterada para ${temperature}°C`);
      return response;
    } catch (error) {
      const msg = error?.response?.data?.error || error.message || 'Erro ao alterar temperatura.';
      toast.error(msg);
      console.error("Erro ao alterar temperatura:", error);
      throw error;
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

  // Função para deletar uma sala (soft reset para "Não configurada")
  const deleteRoom = async (roomId) => {
    const promise = api.delete(`/api/rooms/${roomId}`);

    toast.promise(promise, {
      loading: 'Resetando sala...',
      success: () => {
        // Chama refetch sem await (promessas em background são OK)
        fetchRooms();
        return 'Sala resetada! Reaparecerá em "Salas Disponíveis".';
      },
      error: (err) => err?.response?.data?.error || 'Erro ao resetar a sala.',
    });
    
    return promise;
  };

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => setIsFormOpen(false);

  const addSchedule = async (scheduleData) => {
    try {
      const response = await api.post('/api/schedules', scheduleData);
      await fetchSchedules();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const deleteSchedule = async (scheduleId) => {
    try {
      await api.delete(`/api/schedules/${scheduleId}`);
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      toast.success('Agendamento cancelado!');
    } catch (error) {
      toast.error('Erro ao cancelar agendamento.');
      console.error(error);
    }
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
        setTemperature,
        startIrLearning,
        confirmIrLearning,
        cancelIrLearning,
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
