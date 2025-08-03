# 🎤 音声認識Webアプリケーション

マイクから音声を取り込み、リアルタイムで音声認識を行い、結果を画面に表示するWebアプリケーションです。ローカル音声認識とGoogle音声認識の両方に対応しています。

![音声認識アプリ](https://img.shields.io/badge/Node.js-18+-green)
![音声認識アプリ](https://img.shields.io/badge/License-MIT-blue)
![音声認識アプリ](https://img.shields.io/badge/Speech--API-Google-red)

## 主な機能

- 🎤 マイクからの音声録音
- 🌐 クラウド音声認識API連携（Google、Azure、AWS）
- 📱 レスポンシブデザイン
- 📋 認識結果の履歴表示
- 🔄 ブラウザ音声認識フォールバック機能

## サポートするクラウドAPI

1. **Google Speech-to-Text API** (推奨)
2. **Azure Cognitive Services Speech API**
3. **AWS Transcribe** (実験的サポート)

## 🚀 クイックスタート

### ローカル開発

```bash
# リポジトリクローン
git clone https://github.com/yourusername/voice-recognition-app.git
cd voice-recognition-app

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .envファイルでGoogle API Keyを設定

# サーバー起動
npm start
```

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

http://localhost:3000 にアクセスしてアプリケーションを使用できます。

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

## APIエンドポイント

- `POST /api/speech-to-text` - 音声ファイルから文字起こし
- `GET /api/config` - API設定状況の確認
- `GET /health` - サーバーヘルスチェック

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

## 貢献

プルリクエストやイシューの報告を歓迎します。