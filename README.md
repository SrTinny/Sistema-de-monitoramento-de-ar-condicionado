# 🌎 Sistema de Monitoramento e Controle de Ar-Condicionado via IoT ❄️

Bem-vindo ao Sistema de Monitoramento e Controle de Ar-Condicionado, um projeto full-stack desenvolvido como Trabalho de Conclusão de Curso (TCC). Esta aplicação web permite o gerenciamento e controle remoto de múltiplos aparelhos de ar-condicionado utilizando hardware ESP32, com uma arquitetura moderna e escalável de três camadas.

O sistema conta com autenticação de usuários, controle de acesso baseado em papéis (Administrador e Usuário Comum) e uma interface reativa e intuitiva construída com React.

---

### ✨ Funcionalidades Principais

* **autenticação Segura:** Sistema completo de registro e login com senhas criptografadas e tokens JWT.
* **Painel de Controle Dinâmico:** Dashboard que exibe o status em tempo real de todos os aparelhos de ar-condicionado cadastrados.
* **Controle de Acesso por Papel (Roles):**
    * **Administradores:** Acesso total ao sistema, incluindo o gerenciamento completo (CRUD) dos aparelhos.
    * **Usuários Comuns:** Acesso de visualização e controle básico (ligar/desligar, mudar temperatura).
* **Gerenciamento Completo (CRUD):** Administradores podem adicionar, visualizar, editar e deletar salas/aparelhos através de modais interativos.
* **Interface Adaptativa:** A UI esconde/mostra funcionalidades de acordo com o nível de permissão do usuário logado.
* **Feedback Instantâneo:** Notificações "toast" para todas as ações (sucesso, erro, carregando), melhorando a experiência do usuário.
* **Design Responsivo e Moderno:** Interface com tema claro e escuro, totalmente adaptável a desktops e dispositivos móveis.

---

### 🛠️ Tecnologias Utilizadas

#### **🌐 Frontend (`webapp`)**
* **React.js (Vite):** Para uma interface de usuário rápida e reativa.
* **React Router:** Para gerenciamento de rotas e criação de rotas protegidas.
* **Context API:** Para gerenciamento de estado global de forma escalável (`AuthContext`, `RoomContext`).
* **Axios:** Para comunicação centralizada e segura com a API do backend.
* **CSS Modules:** Para estilização de componentes de forma isolada e organizada.
* **React Hot Toast:** Para notificações elegantes e informativas.

#### **🔧 Backend**
* **Node.js & Express.js:** Para a construção de uma API REST robusta e eficiente.
* **Prisma:** Como ORM para uma interação moderna e segura com o banco de dados.
* **PostgreSQL (Neon):** Banco de dados relacional, escalável e hospedado na nuvem.
* **JSON Web Token (JWT):** Para a implementação de autenticação stateless.
* **Bcrypt:** Para a criptografia segura de senhas de usuários.

#### **📡 Firmware (Hardware)**
* **ESP32:** Microcontrolador com conectividade Wi-Fi.
* **Arduino C++ (PlatformIO):** Para a programação do firmware.
* **Bibliotecas:** `HTTPClient` para comunicação com o backend e `IRremote` para controle do ar-condicionado.

---

### 🏗️ Arquitetura do Sistema

O projeto opera em uma arquitetura de três camadas, onde o Backend atua como o cérebro central.

`[Frontend (React)] ↔️ [Backend API (Node.js)] ↔️ [Firmware (ESP32)]`

1.  **Cadastro:** Um **Administrador** cadastra uma nova sala no sistema web. O backend gera um `deviceId` único para o aparelho.
2.  **Provisionamento:** O `deviceId` gerado é gravado no código do **ESP32**, que é então instalado na sala correspondente.
3.  **Comunicação (Heartbeat):** O **ESP32** conecta-se ao Wi-Fi e envia periodicamente um "heartbeat" para a API do backend, reportando seu status atual.
4.  **Comando:** Um **Usuário** (Admin ou Comum) envia um comando (ex: "Ligar") através do **Frontend**. A requisição vai para o backend.
5.  **Enfileiramento:** O **Backend** armazena o comando como um "comando pendente" no banco de dados para aquele `deviceId`.
6.  **Execução:** No próximo heartbeat, o **ESP32** recebe o comando pendente na resposta da API, o executa (enviando o sinal IR correspondente) e, no heartbeat seguinte, reporta seu novo status.

---

### 🚀 Instalação e Execução

**Pré-requisitos:**
* Node.js (v18 ou superior)
* Git
* VS Code com a extensão PlatformIO

**1. Clone o Repositório**
```sh
git clone [https://github.com/seu-usuario/seu-repositorio.git](https://github.com/seu-usuario/seu-repositorio.git)
cd seu-repositorio
```

**2. Configure o Backend**
```sh
cd backend

# Crie um arquivo .env a partir do exemplo e adicione suas variáveis
# (DATABASE_URL do Neon e um JWT_SECRET)
cp .env.example .env 

# Instale as dependências
npm install

# Aplique as migrações do banco de dados
npx prisma migrate dev

# Inicie o servidor de desenvolvimento
npm run dev
```
O backend estará rodando em `http://localhost:3001`.

**3. Configure o Frontend**
```sh
cd webapp

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```
O frontend estará acessível em `http://localhost:5173`.

**4. Configure o Firmware**
1.  Abra a pasta `firmware` no VS Code com o PlatformIO instalado.
2.  No arquivo `src/main.cpp`, atualize as credenciais do seu Wi-Fi.
3.  Atualize a variável `deviceId` com um ID gerado pelo backend ao cadastrar uma nova sala.
4.  Compile e faça o upload do código para o seu ESP32.
