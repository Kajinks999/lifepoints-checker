# 🚀 LifePoints Checker - Extensão Chrome

![Ícone da Extensão](icons/icon128.png)

Extensão para monitoramento automático de pesquisas no painel LifePoints.

## 📌 Funcionalidades
- ✅ Verificação periódica de novas pesquisas
- 🔔 Notificações visuais quando disponíveis
- ⚙️ Configuração personalizável do intervalo
- 🛡️ Segurança: Nenhum dado sensível é armazenado

## 🛠️ Estrutura do Projeto
main/
├── icons/ # Assets visuais

├── scripts/ # Lógica principal

│ ├── background.js # Processos em segundo plano

│ └── checker.js # Detector de pesquisas

├── popup/ # Interface do usuário

│ ├── popup.html # Estrutura da janela

│ ├── popup.js # Lógica interativa

│ └── popup.css # Estilos visuais

├── manifest.json # Configuração da extensão

└── README.md # Este arquivo

## 🚦 Pré-requisitos
- Chrome ou Edge (versão 88+)
- Permissão para carregar extensões não empacotadas

## ⚡ Instalação
1. Clone o repositório:
   ```bash
   git clone https://github.com/Kajinks999/lifepoints-checker.git
   
### No Navegador
2.Instalação no Chrome ou Opera

Acesse chrome://extensions ou as configurações de extensão do seu navegador

Ative o Modo Desenvolvedor

Clique em Carregar sem compactação

Selecione a pasta /main deste projeto
