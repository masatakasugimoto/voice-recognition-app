# AWS Lightsail Ubuntu デプロイ手順

## 1. Lightsail インスタンス作成

### インスタンス設定
- **OS**: Ubuntu 22.04 LTS
- **プラン**: $5/月以上推奨（メモリ512MB以上）
- **リージョン**: アジア太平洋（東京）

### ネットワーク設定
Lightsailコンソールで以下のポートを開放：
- **SSH**: 22 (デフォルトで開放済み)
- **HTTP**: 80
- **HTTPS**: 443
- **Custom**: 3000 (開発用)

## 2. サーバー環境セットアップ

### SSH接続
```bash
# Lightsailコンソールからブラウザ経由でSSH接続
# または、ダウンロードしたキーファイルを使用
ssh -i your-key.pem ubuntu@YOUR_LIGHTSAIL_IP
```

### システム更新
```bash
sudo apt update
sudo apt upgrade -y
```

### Node.js インストール
```bash
# Node.js 18.x をインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# バージョン確認
node --version
npm --version
```

### Git インストール
```bash
sudo apt install git -y
```

### PM2 インストール（プロセス管理）
```bash
sudo npm install -g pm2
```

## 3. アプリケーションデプロイ

### アプリケーションファイル転送

#### 方法1: GitHub経由（推奨）
```bash
# GitHubリポジトリがある場合
git clone https://github.com/yourusername/voice-recognition-app.git
cd voice-recognition-app
```

#### 方法2: SCP転送
```bash
# ローカルから直接転送
scp -i your-key.pem -r C:\Users\sugimoto\OneDrive\project\webapp ubuntu@YOUR_LIGHTSAIL_IP:~/voice-recognition-app
```

#### 方法3: 手動ファイル作成
```bash
# ディレクトリ作成
mkdir ~/voice-recognition-app
cd ~/voice-recognition-app

# 必要なファイルを一つずつ作成
nano package.json
nano server.js
nano index.html
nano style.css
nano app.js
nano .env
```

### 依存関係インストール
```bash
cd ~/voice-recognition-app
npm install
```

### 環境変数設定
```bash
# .envファイル作成
nano .env

# 以下を追記
GOOGLE_API_KEY=your_google_api_key_here
PORT=3000
NODE_ENV=production
```

## 4. Nginx設定（リバースプロキシ）

### Nginx インストール
```bash
sudo apt install nginx -y
```

### Nginx設定ファイル作成
```bash
sudo nano /etc/nginx/sites-available/voice-recognition-app
```

### 設定内容
```nginx
server {
    listen 80;
    server_name YOUR_LIGHTSAIL_IP;  # または独自ドメイン

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Nginx設定有効化
```bash
# シンボリックリンク作成
sudo ln -s /etc/nginx/sites-available/voice-recognition-app /etc/nginx/sites-enabled/

# デフォルト設定無効化
sudo rm /etc/nginx/sites-enabled/default

# 設定テスト
sudo nginx -t

# Nginx再起動
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 5. SSL/HTTPS設定（Let's Encrypt）

### Certbot インストール
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### SSL証明書取得
```bash
# ドメインがある場合
sudo certbot --nginx -d yourdomain.com

# IPアドレスのみの場合はスキップ
# （音声認識にはHTTPS必須のため、ドメイン取得推奨）
```

## 6. アプリケーション起動

### PM2でアプリ起動
```bash
cd ~/voice-recognition-app

# アプリケーション起動
pm2 start server.js --name "voice-recognition-app"

# 自動起動設定
pm2 startup
pm2 save

# ステータス確認
pm2 status
pm2 logs voice-recognition-app
```

### 手動起動（テスト用）
```bash
# 開発モード
npm start

# またはプロダクションモード
NODE_ENV=production node server.js
```

## 7. ファイアウォール設定

```bash
# UFW有効化
sudo ufw enable

# 必要なポート開放
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# ステータス確認
sudo ufw status
```

## 8. 動作確認

### ローカル確認
```bash
# サーバー上でテスト
curl http://localhost:3000

# ログ確認
pm2 logs voice-recognition-app
```

### ブラウザ確認
```
http://YOUR_LIGHTSAIL_IP
または
https://yourdomain.com
```

## 9. メンテナンス

### アプリ更新
```bash
cd ~/voice-recognition-app

# ファイル更新後
pm2 restart voice-recognition-app

# またはリロード（ゼロダウンタイム）
pm2 reload voice-recognition-app
```

### ログ管理
```bash
# PM2ログ確認
pm2 logs

# Nginxログ確認
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### システム監視
```bash
# システムリソース確認
htop

# ディスク使用量確認
df -h

# PM2監視ダッシュボード
pm2 monit
```

## 10. トラブルシューティング

### よくある問題

#### Node.jsアプリが起動しない
```bash
# ポート競合確認
sudo netstat -tlnp | grep :3000

# PM2ステータス確認
pm2 status
pm2 logs voice-recognition-app
```

#### Nginxエラー
```bash
# 設定ファイルテスト
sudo nginx -t

# Nginxステータス確認
sudo systemctl status nginx
```

#### 音声認識が動作しない
- HTTPS必須（Let's EncryptでSSL設定）
- Google API Keyの設定確認
- ブラウザのマイク許可設定

## 11. セキュリティ強化

### fail2ban インストール
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

### 定期バックアップ設定
```bash
# cronでバックアップ設定
crontab -e

# 毎日深夜2時にバックアップ
0 2 * * * tar -czf /home/ubuntu/backup-$(date +\%Y\%m\%d).tar.gz /home/ubuntu/voice-recognition-app
```

---

## 費用目安
- **Lightsail**: $5-10/月
- **ドメイン**: $10-15/年（オプション）
- **SSL証明書**: 無料（Let's Encrypt）

## 必要な時間
- 初回セットアップ: 1-2時間
- 更新デプロイ: 5-10分