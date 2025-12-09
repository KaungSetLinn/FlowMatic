# セットアップ手順

## 1. リポジトリをクローン
git clone https://github.com/KaungSetLinn/FlowMatic.git

# プロジェクト構造

![Project Structure](./frontend/public/images/project_structure.png)


## 2. 仮想環境の作成（プロジェクトルート）

(新規コマンドプロンプトを開いて)
cd C:\FlowMatic

# 仮想環境を作成
python -m venv venv

# 仮想環境を有効化
# Mac/Linux
source venv/bin/activate
# Windows
venv\Scripts\activate


## 3. バックエンドセットアップ
cd backend

# 必要パッケージをインストール
pip install -r requirements.txt

# 環境変数ファイルをコピーして編集
copy .env.example .env

# マイグレーションを実行
python manage.py migrate

# 開発サーバーを起動
python manage.py runserver


## 4. フロントエンドセットアップ

(新規コマンドプロンプトを開いて)
cd C:\ProjectManagementGroupware

cd frontend

# 依存パッケージをインストール
npm install

# 環境変数ファイルをコピーして編集
copy .env.example .env

# 開発サーバーを起動
npm run dev
