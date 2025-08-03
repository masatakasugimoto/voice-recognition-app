# 📋 GitHubリポジトリ作成・アップロード手順

## 1. GitHub.comでリポジトリ作成

### ステップ1: GitHubアカウント作成・ログイン
1. [GitHub.com](https://github.com) にアクセス
2. アカウントがない場合は「Sign up」で新規作成
3. 既存アカウントでログイン

### ステップ2: 新しいリポジトリ作成
1. 右上の **「+」** ボタンをクリック
2. **「New repository」** を選択
3. 以下の設定を入力：

```
Repository name: voice-recognition-app
Description: 🎤 音声認識Webアプリケーション - ローカル・Google音声認識対応
```

4. リポジトリの設定：
   - ✅ **Public** (無料で利用可能)
   - ✅ **Add a README file**
   - ✅ **Add .gitignore** → **Node** を選択
   - ✅ **Choose a license** → **MIT License** を選択

5. **「Create repository」** をクリック

## 2. ローカルでGit初期設定

### Git設定（初回のみ）
```bash
git config --global user.name "あなたの名前"
git config --global user.email "あなたのメールアドレス"
```

### プロジェクトディレクトリでGit初期化
```bash
# プロジェクトディレクトリに移動
cd C:\Users\sugimoto\OneDrive\project\webapp

# Git初期化
git init

# GitHubリポジトリと接続
git remote add origin https://github.com/yourusername/voice-recognition-app.git

# 現在のブランチをmainに設定
git branch -M main
```

## 3. ファイルをGitHubにアップロード

### ステップ1: ファイルを追加
```bash
# すべてのファイルをステージング
git add .

# コミット
git commit -m "🎤 初回コミット: 音声認識アプリV1.0.0

- ローカル音声認識対応
- Google音声認識対応
- リアルタイム音声認識
- エクスポート機能
- AWS Lightsailデプロイ対応"
```

### ステップ2: GitHubにプッシュ
```bash
# GitHubにプッシュ
git push -u origin main
```

## 4. デプロイ用URLの更新

リポジトリ作成後、以下のファイルのURLを実際のものに更新：

### README.md の更新
```bash
# あなたのGitHubユーザー名に置き換え
git clone https://github.com/YOUR_USERNAME/voice-recognition-app.git
```

### deploy.sh の更新
```bash
# ダウンロードURLを実際のものに更新
wget https://raw.githubusercontent.com/YOUR_USERNAME/voice-recognition-app/main/deploy.sh
```

## 5. Lightsailでの使用方法

GitHubリポジトリ作成後、Lightsailサーバーでは以下のコマンドが使用可能：

```bash
# 方法1: リポジトリからクローン
git clone https://github.com/YOUR_USERNAME/voice-recognition-app.git
cd voice-recognition-app
npm install

# 方法2: デプロイスクリプト使用
wget https://raw.githubusercontent.com/YOUR_USERNAME/voice-recognition-app/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

## 6. 更新時の手順

アプリを更新した場合：

### ローカルで更新をコミット
```bash
git add .
git commit -m "🔧 機能追加: 説明"
git push origin main
```

### Lightsailサーバーで更新を反映
```bash
cd ~/voice-recognition-app
git pull origin main
npm install  # 新しい依存関係がある場合
pm2 restart voice-recognition-app
```

## 7. トラブルシューティング

### 認証エラーが発生した場合
```bash
# HTTPS認証設定
git config --global credential.helper store

# または SSH鍵を設定（推奨）
ssh-keygen -t ed25519 -C "your_email@example.com"
# 生成された公開鍵をGitHubに登録
```

### プッシュ時にエラーが発生した場合
```bash
# リモートの変更を取得
git pull origin main --allow-unrelated-histories

# 再度プッシュ
git push origin main
```

## 8. 成功確認

✅ GitHubページでファイルが表示される  
✅ README.mdが正しく表示される  
✅ Lightsailからwgetでダウンロード可能  

---

**次のステップ**: GitHubリポジトリが作成できたら、LightsailサーバーでGitを使ったデプロイが可能になります！