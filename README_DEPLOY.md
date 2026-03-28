# Instruções de Migração e Hospedagem (Firebase)

Este projeto foi preparado para ser hospedado no **Firebase Hosting**. Siga os passos abaixo para migrar do GitHub para o ambiente de produção.

## 1. Configuração do Firebase CLI
Certifique-se de ter o Firebase CLI instalado em sua máquina local:
```bash
npm install -g firebase-tools
```

## 2. Login e Inicialização
No diretório raiz do projeto, faça o login:
```bash
firebase login
```

O projeto já contém os arquivos de configuração necessários:
- `firebase.json`: Configurações de Hosting e Firestore.
- `.firebaserc`: Define o projeto padrão (`ai-studio-applet-webapp-c2767`).

## 3. Deploy Manual
Para realizar o deploy manualmente:
```bash
npm run deploy
```
Este comando irá:
1. Limpar a pasta `dist`.
2. Gerar o build de produção (`vite build`).
3. Enviar os arquivos para o Firebase Hosting e as regras para o Firestore.

## 4. Automação com GitHub Actions
Foi criado um workflow em `.github/workflows/firebase-deploy.yml`. Para que ele funcione, você precisa configurar os segredos no seu repositório GitHub:

1. Vá em **Settings > Secrets and variables > Actions** no seu repositório GitHub.
2. Adicione um novo segredo chamado `FIREBASE_SERVICE_ACCOUNT_AI_STUDIO_APPLET_WEBAPP_C2767`.
   - Você pode obter este valor gerando uma chave de conta de serviço no Console do Firebase (**Project Settings > Service accounts > Generate new private key**).
3. O deploy será automático sempre que você fizer um `push` para a branch `main`.

## 5. Domínios Autorizados
Não esqueça de adicionar o seu domínio de produção (ex: `seu-app.web.app`) na lista de **Domínios Autorizados** no Console do Firebase (**Authentication > Settings > Authorized Domains**) para que o Google Login funcione corretamente.

---
**Nota:** O arquivo `firebase-applet-config.json` está sendo usado para as credenciais. Em um ambiente de produção real, recomenda-se mover estas chaves para variáveis de ambiente (`.env`).
