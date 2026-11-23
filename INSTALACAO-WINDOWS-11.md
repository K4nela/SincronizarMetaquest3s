# Instalação no Windows 11

## 1. Instalar o Node.js
1. No notebook, abra https://nodejs.org/
2. Baixe a versão **LTS** para Windows.
3. Execute o instalador e mantenha as opções padrão.
4. Ao terminar, feche e abra novamente o Explorador de Arquivos ou o Terminal.

Para conferir, abra o menu Iniciar, procure por **Terminal** ou **Prompt de Comando** e execute:
```bat
node -v
npm -v
```
Os dois comandos devem mostrar números de versão.

## 2. Extrair o projeto
1. Extraia `quest3s_servidor_painel_v0_1.zip` para uma pasta, por exemplo:
   `C:\Quest3S\`
2. Entre na pasta extraída.
3. Dê dois cliques em `iniciar-servidor.bat`.
4. Na primeira execução, o script instala as dependências automaticamente.
5. Quando aparecer a mensagem de que o servidor está disponível na porta 8080, mantenha a janela aberta.

É necessário internet no notebook somente na primeira instalação das dependências. Depois, o servidor pode funcionar sem internet, desde que a rede local esteja ativa.

## 3. Permitir a comunicação no Firewall do Windows
Na primeira execução, o Windows pode mostrar uma janela perguntando se o Node.js pode se comunicar em redes.
- Marque **Redes privadas** somente se o Wi-Fi do espaço for uma rede confiável e administrada pelo espaço.
- Não habilite em redes públicas.
- Se a janela não aparecer, o responsável pela TI pode criar uma regra de entrada TCP para a porta `8080`, limitada ao perfil **Privado** e, idealmente, à sub-rede local do espaço.

Não desative o Firewall do Windows.

## 4. Descobrir o IP do notebook
1. Conecte o notebook ao Wi-Fi do espaço.
2. Abra o Prompt de Comando.
3. Execute:
```bat
ipconfig
```
4. Na seção do adaptador Wi-Fi, localize **Endereço IPv4**. Exemplo fictício: `192.168.1.25`.

No celular conectado à mesma rede Wi-Fi, abra:
`http://192.168.1.25:8080`

Troque o IP de exemplo pelo endereço real do notebook.

## 5. Fazer o teste do painel
1. No celular, abra o endereço do servidor.
2. Toque em **Simular 10 óculos**.
3. Verifique se aparecem Q01 a Q10 como conectados/prontos.
4. Teste PLAY, PAUSE e REINICIAR.
5. Para encerrar o servidor, volte ao notebook e pressione `Ctrl+C` na janela do servidor.

## 6. Se o celular não abrir o painel
Confira:
- notebook e celular estão no mesmo Wi-Fi;
- o notebook não está conectado a uma VPN;
- o Windows identificou a rede como privada, se for uma rede confiável;
- o Firewall permite a porta TCP 8080;
- a rede Wi-Fi não possui isolamento de clientes ou bloqueio de comunicação entre dispositivos;
- o IP usado no celular é o IPv4 do adaptador Wi-Fi do notebook.

## Observações de segurança e escopo
Esta versão é um protótipo de rede local sem autenticação. Qualquer pessoa que consiga acessar o endereço do painel na rede poderá enviar comandos. Não use em uma rede pública ou compartilhada sem autorização e sem implementar autenticação.

O modo de simulação apenas testa o painel e o servidor. Ele **não** controla headsets reais nem reproduz o vídeo. A integração com o aplicativo dos Meta Quest 3S será desenvolvida na próxima etapa.
