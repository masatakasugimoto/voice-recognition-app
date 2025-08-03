#!/bin/bash

# 音声認識アプリ - Lightsail Ubuntu 自動デプロイスクリプト
# 使用方法: chmod +x deploy.sh && ./deploy.sh

echo "🚀 音声認識アプリ デプロイ開始"

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# エラーハンドリング
set -e

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. システム更新
print_status "システムパッケージを更新中..."
sudo apt update && sudo apt upgrade -y

# 2. Node.js インストール確認
if ! command -v node &> /dev/null; then
    print_status "Node.js をインストール中..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js は既にインストール済み: $(node --version)"
fi

# 3. Git インストール確認
if ! command -v git &> /dev/null; then
    print_status "Git をインストール中..."
    sudo apt install git -y
else
    print_status "Git は既にインストール済み"
fi

# 4. PM2 インストール確認
if ! command -v pm2 &> /dev/null; then
    print_status "PM2 をインストール中..."
    sudo npm install -g pm2
else
    print_status "PM2 は既にインストール済み"
fi

# 5. アプリケーションディレクトリ作成
APP_DIR="$HOME/voice-recognition-app"
if [ ! -d "$APP_DIR" ]; then
    print_status "アプリケーションディレクトリを作成中..."
    mkdir -p "$APP_DIR"
fi

cd "$APP_DIR"

# 6. package.json 作成
print_status "package.json を作成中..."
cat > package.json << 'EOF'
{
  "name": "voice-recognition-app",
  "version": "1.0.0",
  "description": "音声認識Webアプリケーション",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"No tests specified\" && exit 0"
  },
  "keywords": [
    "speech-recognition",
    "voice",
    "web-app",
    "cloud-api"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "node-fetch": "^2.6.7",
    "form-data": "^4.0.0",
    "aws-sdk": "^2.1490.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF

# 7. 依存関係インストール
print_status "npm パッケージをインストール中..."
npm install

# 8. .env ファイル作成（既存の場合はスキップ）
if [ ! -f ".env" ]; then
    print_warning ".env ファイルを作成します。Google API キーを設定してください。"
    cat > .env << 'EOF'
# Google Speech-to-Text API
GOOGLE_API_KEY=your_google_api_key_here

# サーバー設定
PORT=3000
NODE_ENV=production
EOF
    print_warning ".env ファイルを編集してGoogle API キーを設定してください: nano .env"
else
    print_status ".env ファイルは既に存在します"
fi

# 9. Nginx インストール確認
if ! command -v nginx &> /dev/null; then
    print_status "Nginx をインストール中..."
    sudo apt install nginx -y
    
    # Nginx設定ファイル作成
    print_status "Nginx 設定を作成中..."
    sudo tee /etc/nginx/sites-available/voice-recognition-app > /dev/null << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # 設定有効化
    sudo ln -sf /etc/nginx/sites-available/voice-recognition-app /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Nginx テストと再起動
    sudo nginx -t
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
else
    print_status "Nginx は既にインストール済み"
fi

# 10. ファイアウォール設定
print_status "ファイアウォールを設定中..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# 11. アプリケーション起動
print_status "アプリケーションを起動中..."

# 既存のPM2プロセスを停止
pm2 delete voice-recognition-app 2>/dev/null || true

# 新しいプロセスを開始
pm2 start server.js --name "voice-recognition-app"
pm2 startup
pm2 save

# 12. 状態確認
print_status "デプロイ完了状況を確認中..."
echo ""
echo "📊 システム状況:"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "PM2: $(pm2 --version)"

echo ""
echo "🔧 サービス状況:"
sudo systemctl is-active nginx && echo "✅ Nginx: アクティブ" || echo "❌ Nginx: 非アクティブ"
pm2 list

echo ""
echo "🌐 アクセス情報:"
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com/)
echo "パブリックIP: http://$PUBLIC_IP"
echo "ローカル: http://localhost:3000"

echo ""
print_status "デプロイが完了しました！"
echo ""
echo "📝 次のステップ:"
echo "1. .env ファイルにGoogle API キーを設定: nano ~/voice-recognition-app/.env"
echo "2. アプリを再起動: cd ~/voice-recognition-app && pm2 restart voice-recognition-app"
echo "3. ドメインがある場合はSSL設定: sudo certbot --nginx -d yourdomain.com"
echo ""
echo "🔑 Google API Key設定例:"
echo "GOOGLE_API_KEY=AIzaSyDmXqEYwjN906TXW5deeOTefNsYpiZ5wXg"
echo ""
print_warning "音声認識にはHTTPS必須です。ドメインとSSL証明書の設定を推奨します。"