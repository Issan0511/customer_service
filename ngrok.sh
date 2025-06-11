#!/bin/bash

# ngrok起動とURL取得ヘルパースクリプト

echo "🌐 ngrokを起動してLINE Bot用のトンネルを作成します..."

# ngrokをバックグラウンドで起動
ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

echo "⏳ ngrokの起動を待機中..."
sleep 5

# ngrokのURLを取得
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app')

if [ -z "$NGROK_URL" ]; then
    echo "❌ ngrokのURLを取得できませんでした"
    echo "📋 手動でngrokのダッシュボードを確認してください: http://localhost:4040"
    exit 1
fi

echo "✅ ngrok URL: $NGROK_URL"
echo ""
echo "📝 次の手順を実行してください:"
echo "1. LINE Developersコンソールで Webhook URL を設定:"
echo "   $NGROK_URL/webhook"
echo ""
echo "2. .envファイルのNGROK_DOMAINを更新:"
echo "   NGROK_DOMAIN=$(echo $NGROK_URL | sed 's/https:\/\///')"
echo ""
echo "3. アプリケーションを再起動してください"
echo ""
echo "🛑 ngrokを停止するには Ctrl+C を押してください"

# ユーザーがCtrl+Cを押すまで待機
trap "echo; echo '🛑 ngrokを停止中...'; kill $NGROK_PID; rm -f ngrok.log; echo '✅ ngrok停止完了'; exit 0" INT

tail -f ngrok.log
