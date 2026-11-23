# Controle local — Meta Quest 3S (versão 0.1)

Este pacote contém a primeira entrega do servidor local e painel mobile.

## O que já funciona
- Servidor HTTP no notebook.
- Painel web responsivo para celulares.
- Comunicação WebSocket em tempo real.
- Identificação dos slots Q01 a Q10.
- Simulação dos dez óculos para testar o painel.
- Comandos globais PLAY, PAUSE e REINICIAR com agendamento de 1,8 s.
- Duração de demonstração configurada em 3 minutos.

## O que ainda NÃO está integrado
Esta versão não controla headsets reais e não reproduz vídeo. O botão "Simular 10 óculos" serve apenas para validar o painel. A próxima etapa é criar o aplicativo Unity para os Quest, que se conectará ao WebSocket e enviará prontidão, posição e heartbeat.

## Requisitos
- Notebook com Windows 10/11, macOS ou Linux.
- Node.js LTS instalado.
- Notebook, smartphones e Quest conectados à mesma rede Wi-Fi.
- A rede deve permitir comunicação entre dispositivos (sem isolamento de clientes).

## Instalação
1. Extraia o ZIP em uma pasta do notebook.
2. Instale Node.js LTS: https://nodejs.org/
3. Abra o terminal dentro da pasta extraída.
4. Execute:

   npm install
   npm start

5. O terminal exibirá a porta 8080.
6. Descubra o endereço IPv4 do notebook:
   - Windows: `ipconfig`
   - macOS/Linux: `ifconfig` ou `ip addr`
7. No celular conectado ao mesmo Wi-Fi, abra `http://IP-DO-NOTEBOOK:8080`.
   Exemplo: `http://192.168.1.10:8080`

Se o firewall perguntar, permita Node.js na rede privada/local.

## Teste inicial
1. Abra o painel no celular.
2. Toque em "Simular 10 óculos".
3. Confira os dez slots como conectados/prontos.
4. Teste PLAY, PAUSE e REINICIAR.

A simulação não substitui o teste com headsets reais.

## Protocolo WebSocket para o futuro aplicativo Quest
Endpoint: `ws://IP-DO-NOTEBOOK:8080/ws`

Ao conectar, o aplicativo deve enviar:
```json
{"role":"device","id":"Q01","ready":true,"positionMs":0}
```

Para atualizar prontidão/posição:
```json
{"type":"DEVICE_STATUS","ready":true,"positionMs":0}
```

Heartbeat:
```json
{"type":"HEARTBEAT"}
```

O servidor envia comandos:
```json
{
  "type":"COMMAND",
  "command":"PLAY",
  "startAt":1795460000000,
  "positionMs":0,
  "sessionId":"S-..."
}
```

Comandos previstos: `PLAY`, `PAUSE`, `RESTART`.

## Observações importantes
- Use somente em uma rede local confiável. Esta versão de protótipo não tem autenticação; qualquer pessoa com acesso à rede e ao endereço do painel pode enviar comandos.
- Para uso público, a próxima versão deve incluir autenticação simples dos monitores, proteção do endpoint e tratamento de reconexão.
- Para precisão, o aplicativo Quest deverá estimar diferença de relógio/latência e executar comandos no horário agendado. O horário futuro sozinho não garante sincronização sub-100 ms.
- O painel apresenta estado global do servidor. A integração real deverá também reportar divergências de cada headset.
- Não exponha a porta 8080 diretamente à internet.
