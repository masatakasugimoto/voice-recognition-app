# 🚀 アプリケーションポータル

複数のWebアプリケーションを統合管理するポータルシステムです。現在、音声認識アプリが稼働中で、今後様々なアプリケーションを追加予定です。

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![HTTPS](https://img.shields.io/badge/HTTPS-Supported-blue)
![Apps](https://img.shields.io/badge/Apps-1_Active-brightgreen)

## 🎯 主な機能

### アプリケーションポータル
- 🏠 統一されたメインメニュー
- 📊 アプリケーション統計表示
- 🎨 レスポンシブなカードUI
- 🔗 各アプリへのシームレスナビゲーション

### 音声認識アプリ（V2.2）
- 🎤 リアルタイム音声認識
- 🌍 4言語翻訳機能（英語、中国語、ドイツ語、イタリア語）
- 🔊 翻訳結果の音声読み上げ
- 📋 音声認識・翻訳履歴管理
- 💾 認識結果のエクスポート機能
- 🌐 クラウド音声認識API連携（Google、Azure、AWS）

## サポートするクラウドAPI

1. **Google Speech-to-Text API** (推奨)
2. **Azure Cognitive Services Speech API**
3. **AWS Transcribe** (実験的サポート)

## 🚀 クイックスタート

### ローカル開発

```bash
# リポジトリクローン
git clone https://github.com/yourusername/application-portal.git
cd application-portal

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .envファイルでGoogle API Keyを設定

# サーバー起動（管理者権限が必要）
npm start
```

### アクセス方法

- **アプリケーションポータル**: 
  - HTTP: `http://localhost/main-menu.html`
  - HTTPS: `https://localhost/main-menu.html`
- **音声認識アプリ**: 
  - HTTP: `http://localhost/`
  - HTTPS: `https://localhost/`

### AWS Lightsailデプロイ

```bash
# Lightsailサーバーにログイン後
wget https://raw.githubusercontent.com/yourusername/voice-recognition-app/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env`にコピーして、使用するAPIの認証情報を設定してください：

```bash
cp .env.example .env
```

#### Google Speech-to-Text APIの設定
```env
GOOGLE_API_KEY=your_google_api_key_here
```

#### Azure Speech APIの設定
```env
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_REGION=japaneast
```

#### AWS Transcribeの設定
```env
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=ap-northeast-1
```

### 3. サーバーの起動

```bash
# 本番環境
npm start

# 開発環境（nodemon使用）
npm run dev
```

### 4. ブラウザでアクセス

- アプリケーションポータル: `http://localhost/main-menu.html` または `https://localhost/main-menu.html`
- 音声認識アプリ: `http://localhost/` または `https://localhost/`

**注意**: HTTPS接続には管理者権限でのサーバー起動が必要です。

## 使用方法

1. **録音開始**: 🎤録音開始ボタンをクリック
2. **マイク許可**: ブラウザがマイクへのアクセス許可を求めたら「許可」を選択
3. **音声入力**: マイクに向かって話す
4. **録音停止**: ⏹️録音停止ボタンをクリック
5. **結果確認**: 音声認識結果が画面に表示されます

## 技術仕様

### フロントエンド
- HTML5 (MediaRecorder API)
- CSS3 (レスポンシブデザイン)
- JavaScript (ES6+)
- Web Speech API (フォールバック)

### バックエンド
- Node.js
- Express.js
- Multer (ファイルアップロード)
- 各種クラウドAPIライブラリ

### 対応ブラウザ
- Chrome 47+
- Firefox 25+
- Safari 14+
- Edge 79+

## 🌐 サーバー仕様

### HTTP/HTTPS両対応
- **HTTP**: ポート80（標準）
- **HTTPS**: ポート443（SSL/TLS対応）
- 自己署名証明書による開発環境サポート
- 本番環境では適切なSSL証明書を使用

### APIエンドポイント

#### 音声認識API
- `POST /api/speech-to-text` - 音声ファイルから文字起こし
- `POST /api/translate` - テキスト翻訳
- `GET /api/translate/test` - 翻訳API動作テスト

#### システムAPI
- `GET /api/config` - API設定状況の確認
- `GET /health` - サーバーヘルスチェック

### ディレクトリ構成

```
webapp/
├── main-menu.html          # アプリケーションポータル
├── main-menu.css          # ポータルスタイル
├── main-menu.js           # ポータル機能
├── index.html             # 音声認識アプリ
├── app.js                 # 音声認識ロジック
├── style.css             # アプリスタイル
├── server.js             # 統合サーバー
├── cert.pem              # SSL証明書
├── key.pem               # SSL秘密鍵
└── .env                  # 環境設定
```

## フォールバック機能

クラウドAPIが利用できない場合、ブラウザの Web Speech API を自動的に使用します：

- Chrome: Web Speech API
- Firefox: 限定的サポート
- Safari: 限定的サポート

## トラブルシューティング

### マイクが認識されない
- ブラウザのマイク許可設定を確認
- HTTPSでアクセスしているか確認（localhost除く）

### 音声認識が動作しない
- 環境変数が正しく設定されているか確認
- APIキーの有効性を確認
- `/health`エンドポイントでサービス状況を確認

### ネットワークエラー
- インターネット接続を確認
- ファイアウォール設定を確認

## ライセンス

MIT License

## 📱 新規アプリ統合ガイド

### ステップ1: アプリ開発
```bash
# 新規アプリディレクトリ作成
mkdir your-new-app
cd your-new-app

# アプリ開発
# - index.html (メインページ)
# - style.css (スタイル)
# - script.js (ロジック)
```

### ステップ2: ポータル統合

1. **HTMLカード追加** (`main-menu.html`)
```html
<div class="app-card featured" onclick="openApp('your-new-app')">
    <div class="app-icon">📝</div>
    <div class="app-info">
        <h3>新しいアプリ名</h3>
        <p class="app-description">アプリの説明</p>
        <div class="app-features">
            <span class="feature-tag">🏷️ 機能1</span>
        </div>
        <div class="app-version">V1.0</div>
    </div>
    <div class="app-status active">✓ 稼働中</div>
</div>
```

2. **JavaScript更新** (`main-menu.js`)
```javascript
function openApp(appId) {
    switch(appId) {
        case 'your-new-app':
            window.location.href = '/your-new-app/index.html';
            break;
    }
}
```

3. **サーバールート追加** (`server.js`)
```javascript
app.get('/your-new-app', (req, res) => {
    res.sendFile(path.join(__dirname, 'your-new-app', 'index.html'));
});
app.use('/your-new-app', express.static('your-new-app'));
```

### ステップ3: 統計更新
- メインメニューの稼働中アプリ数を更新
- 必要に応じて新機能を追加

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します。新規アプリの統合についてもお気軽にご相談ください。