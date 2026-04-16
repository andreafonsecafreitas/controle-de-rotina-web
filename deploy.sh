#!/bin/bash

# Este script fará o deploy automático das suas atualizações para a DigitalOcean.
# Certifique-se de que você já fez o "git push" do seu código para o GitHub antes de rodar.

# Configurações do seu Servidor
VPS_IP="137.184.58.225"
VPS_USER="root"
VPS_PASS="mateus2000Unifei"
PROJECT_DIR="/var/www/controle-de-rotina-web"

echo "=========================================="
echo "🚀 Iniciando Deploy para a DigitalOcean..."
echo "=========================================="

# Comando completo que será enviado e executado remotamente na sua VPS
# Note que usamos 'git pull' sem passar a branch, para pegar o padrão atual (geralmente main/master)
SSH_COMMAND="cd $PROJECT_DIR && \
echo '⬇️  Puxando código novo do GitHub...' && \
git pull && \
echo '📦 Instalando dependências (se houver novas)...' && \
npm install && \
echo '🏗️  Construindo os arquivos otimizados (npm run build)...' && \
npm run build && \
echo '✅ Compilação finalizada!'"

# Usa o sshpass que instalamos mais cedo para entrar automaticamente
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "$SSH_COMMAND"

echo "=========================================="
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO! "
echo "🌐 O seu site (https://controlerotinagame.com.br) já está atualizado na internet."
echo "=========================================="
