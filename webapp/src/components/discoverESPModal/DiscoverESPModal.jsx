import React, { useRef, useState } from 'react';
import styles from './DiscoverESPModal.module.css';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const DiscoverESPModal = ({ isOpen, onClose, onESPAdded }) => {
  const [step, setStep] = useState('discover');
  const [discovering, setDiscovering] = useState(false);
  const [espList, setESPList] = useState([]);
  const [selectedESP, setSelectedESP] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const [password, setPassword] = useState('');
  const [configuring, setConfiguring] = useState(false);
  const reconnectToastIdRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const clearReconnectFeedback = () => {
    if (reconnectToastIdRef.current) {
      toast.dismiss(reconnectToastIdRef.current);
      reconnectToastIdRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const withTimeout = async (promise, timeoutMs = 4000) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
  };

  const fetchEspStatusDirect = async (ip) => {
    const response = await withTimeout(fetch(`http://${ip}/wifi/status`), 2500);
    if (!response.ok) throw new Error(`status ${response.status}`);

    const data = await response.json();
    if (!data?.deviceId) throw new Error('deviceId ausente');

    return {
      deviceId: data.deviceId,
      ip,
      ssid: data.ssid || 'Not configured',
      connected: Boolean(data.connected),
      apName: `AC-SETUP-${String(data.deviceId).slice(-6).toUpperCase()}`,
    };
  };

  const fetchNetworksDirect = async (ip) => {
    const response = await withTimeout(fetch(`http://${ip}/wifi/networks`), 5000);
    if (!response.ok) throw new Error(`status ${response.status}`);

    const data = await response.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.networks)) return data.networks;
    return [];
  };

  const configureDirect = async (ip, ssid, wifiPassword) => {
    const response = await withTimeout(
      fetch(`http://${ip}/wifi/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, password: wifiPassword }),
      }),
      7000
    );

    if (!response.ok) throw new Error(`status ${response.status}`);
    return response.json();
  };

  const discoverDirectFromAp = async () => {
    const ips = ['192.168.4.1', '192.168.4.2', '192.168.4.3'];
    const results = await Promise.allSettled(ips.map((ip) => fetchEspStatusDirect(ip)));
    return results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);
  };

  const discoverESPs = async () => {
    setDiscovering(true);
    try {
      const directList = await discoverDirectFromAp();
      if (directList.length > 0) {
        setESPList(directList);
        toast.success(`${directList.length} ESP(s) encontrado(s)!`);
        return;
      }

      const response = await api.get('/api/esp/discover');
      const backendList = response?.data?.espList || [];
      if (backendList.length > 0) {
        setESPList(backendList);
        toast.success(`${backendList.length} ESP(s) encontrado(s)!`);
        return;
      }

      toast.error('Nenhum ESP encontrado. Conecte-se ao Wi-Fi AC-SETUP-XXXXX e tente novamente.');
      toast.error('Se estiver em produção, valide também o VITE_API_URL e o deploy do backend.');
    } catch (error) {
      toast.error('Erro ao procurar ESPs: ' + error.message);
      console.error(error);
    } finally {
      setDiscovering(false);
    }
  };

  const fetchNetworks = async (espIp) => {
    setLoadingNetworks(true);
    try {
      const directNetworks = await fetchNetworksDirect(espIp);
      if (directNetworks.length > 0) {
        setNetworks(directNetworks);
        return;
      }

      const response = await api.get(`/api/esp/${espIp}/networks`);
      setNetworks(response?.data?.networks || []);
    } catch (error) {
      try {
        const response = await api.get(`/api/esp/${espIp}/networks`);
        setNetworks(response?.data?.networks || []);
      } catch (backendError) {
        toast.error('Erro ao obter redes disponíveis: ' + backendError.message);
        setNetworks([]);
      }
    } finally {
      setLoadingNetworks(false);
    }
  };

  const selectESP = async (esp) => {
    setSelectedESP(esp);
    await fetchNetworks(esp.ip);
    setStep('selectNetwork');
  };

  const selectNetwork = (network) => {
    setSelectedESP((prev) => ({ ...prev, selectedNetwork: network }));
    setPassword('');
    setStep('configure');
  };

  const configureViaBackend = async (espIp, ssid, wifiPassword) => {
    return api.post('/api/esp/configure', {
      espIp,
      ssid,
      password: wifiPassword,
    });
  };

  const configureWiFi = async () => {
    if (!password || password.length < 3) {
      toast.error('Senha deve ter pelo menos 3 caracteres');
      return;
    }

    setConfiguring(true);
    try {
      let message = 'Configuração enviada. O ESP vai reiniciar em alguns segundos.';

      try {
        const directResponse = await configureDirect(
          selectedESP.ip,
          selectedESP.selectedNetwork.ssid,
          password
        );
        if (directResponse?.message) {
          message = directResponse.message;
        }
      } catch (directError) {
        const response = await configureViaBackend(
          selectedESP.ip,
          selectedESP.selectedNetwork.ssid,
          password
        );
        if (response?.data?.message) {
          message = response.data.message;
        }
      }

      toast.success(message);
      clearReconnectFeedback();
      reconnectToastIdRef.current = toast.loading('Aguardando ESP reiniciar e conectar...');

      reconnectTimeoutRef.current = setTimeout(() => {
        if (reconnectToastIdRef.current) {
          toast.dismiss(reconnectToastIdRef.current);
          reconnectToastIdRef.current = null;
        }
        if (onESPAdded) {
          onESPAdded(selectedESP);
        }
        closeModal();
        toast.success('ESP configurado com sucesso!');
      }, 10000);
    } catch (error) {
      clearReconnectFeedback();
      toast.error('Erro ao configurar WiFi: ' + error.message);
      console.error(error);
    } finally {
      setConfiguring(false);
    }
  };

  const closeModal = () => {
    clearReconnectFeedback();
    setStep('discover');
    setESPList([]);
    setSelectedESP(null);
    setNetworks([]);
    setPassword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Adicionar Novo AC (ESP)</h2>
          <button className={styles.closeBtn} onClick={closeModal}>✕</button>
        </div>

        <div className={styles.content}>
          {step === 'discover' && (
            <div className={styles.step}>
              <p className={styles.instructions}>
                Para adicionar um novo AC:
                <br /><br />
                1. Conecte seu celular/PC ao WiFi: <strong>AC-SETUP-XXXXX</strong>
                <br />
                2. Uma guia do navegador abrirá automaticamente (captive portal)
                <br />
                3. Se não abrir, acesse: <strong>http://192.168.4.1</strong>
                <br />
                4. Na página, clique em <strong>"Configure WiFi"</strong>
                <br />
                5. Selecione sua rede WiFi e digite a senha
                <br />
                6. Clique em <strong>"Save"</strong> e aguarde o ESP reiniciar
                <br />
                7. Volte para este sistema e clique em "Procurar ESPs"
              </p>

              <button
                className={styles.primaryBtn}
                onClick={discoverESPs}
                disabled={discovering}
              >
                {discovering ? 'Procurando...' : 'Procurar ESPs'}
              </button>

              {espList.length > 0 && (
                <div className={styles.espList}>
                  <h3>ESPs Encontrados:</h3>
                  {espList.map((esp, idx) => (
                    <div key={idx} className={styles.espItem}>
                      <div className={styles.espInfo}>
                        <strong>{esp.deviceId}</strong>
                        <small>AP: {esp.apName}</small>
                        <small>IP: {esp.ip}</small>
                      </div>
                      <button
                        className={styles.selectBtn}
                        onClick={() => selectESP(esp)}
                      >
                        Selecionar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'selectNetwork' && (
            <div className={styles.step}>
              <h3>Redes Disponíveis</h3>
              <p className={styles.subtext}>Escolha a rede WiFi que deseja conectar</p>

              {loadingNetworks ? (
                <p>Carregando redes...</p>
              ) : networks.length > 0 ? (
                <div className={styles.networkList}>
                  {networks.map((network, idx) => (
                    <div
                      key={idx}
                      className={styles.networkItem}
                      onClick={() => selectNetwork(network)}
                    >
                      <div className={styles.networkSignal}>
                        📶 {network.rssi > -60 ? '🟢' : network.rssi > -80 ? '🟡' : '🔴'}
                      </div>
                      <div className={styles.networkName}>{network.ssid || 'Rede Oculta'}</div>
                      <div className={styles.networkStrength}>{network.rssi} dBm</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>
                  Nenhuma rede encontrada. Toque em Voltar e selecione o ESP novamente para reescanear.
                </p>
              )}

              <button
                className={styles.secondaryBtn}
                onClick={() => {
                  setStep('discover');
                  setSelectedESP(null);
                }}
              >
                Voltar
              </button>
            </div>
          )}

          {step === 'configure' && (
            <div className={styles.step}>
              <h3>Configurar WiFi</h3>
              <div className={styles.configInfo}>
                <p><strong>Dispositivo:</strong> {selectedESP?.deviceId}</p>
                <p><strong>Rede:</strong> {selectedESP?.selectedNetwork?.ssid}</p>
              </div>

              <div className={styles.form}>
                <label>Senha WiFi</label>
                <input
                  type="password"
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={configuring}
                />
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.primaryBtn}
                  onClick={configureWiFi}
                  disabled={configuring || !password}
                >
                  {configuring ? 'Configurando...' : 'Confirmar'}
                </button>
                <button
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setStep('selectNetwork');
                    setPassword('');
                  }}
                  disabled={configuring}
                >
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverESPModal;
