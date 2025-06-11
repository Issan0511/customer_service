#!/bin/bash

# Customer Service LINE Bot テストスクリプト

echo "🚀 LINE Bot Customer Service テストを開始します..."

# 環境変数の確認
if [ ! -f .env ]; then
    echo "❌ .envファイルが見つかりません"
    exit 1
fi

# アプリケーションの起動
echo "📱 アプリケーションを起動中..."
npm start &
APP_PID=$!

# 少し待機
sleep 3

# アプリケーションが起動したかチェック
if ! curl -s http://localhost:3000/form?userId=test123 > /dev/null; then
    echo "❌ アプリケーションの起動に失敗しました"
    kill $APP_PID
    exit 1
fi

echo "✅ アプリケーションが正常に起動しました (PID: $APP_PID)"
echo "🌐 http://localhost:3000/form?userId=test123 でフォームをテストできます"
echo ""
echo "🔗 ngrokを使用するには、別のターミナルで以下を実行してください:"
echo "   ngrok http 3000"
echo ""
echo "⚠️  ngrokのURLを取得したら、.envファイルのNGROK_DOMAINを更新してください"
echo ""
echo "🛑 テストを終了するには Ctrl+C を押してください"

# ユーザーがCtrl+Cを押すまで待機
trap "echo; echo '🛑 アプリケーションを停止中...'; kill $APP_PID; echo '✅ テスト完了'; exit 0" INT

wait $APP_PID
