function getFormHtml(userId = '') {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Customer Service Form</title>
  <style>
    /* ベーススタイル */
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { 
      max-width: 600px; 
      width: 90%;
      margin: 40px auto; 
      background: #fff; 
      padding: 30px; 
      border-radius: 10px; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      box-sizing: border-box;
    }
    h1 { color: #333; text-align: center; margin-bottom: 20px; }
    label { display: block; margin: 15px 0 5px; font-weight: bold; }
    input[type="text"], select { 
      width: 100%; 
      padding: 15px; 
      border: 2px solid #ddd; 
      border-radius: 5px; 
      font-size: 18px;
      box-sizing: border-box;
    }
    button { 
      background-color: #00C300; 
      color: white; 
      padding: 15px 30px; 
      border: none; 
      border-radius: 5px; 
      font-size: 16px; 
      cursor: pointer; 
      width: 100%; 
      margin-top: 20px;
      box-sizing: border-box;
    }
    button:hover { background-color: #00A300; }

    /* レスポンシブ調整 */
    @media (max-width: 480px) {
      .container {
        padding: 20px;
        margin: 20px auto;
      }
      input[type="text"], select, button {
        padding: 12px;
        font-size: 16px;
      }
      label { margin: 10px 0 4px; font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Customer Service Form</h1>
    <form method="POST" action="/submit">
      <input type="hidden" name="userId" value="${userId}">

      <label for="name">氏名を入力してください</label>
      <input type="text" id="name" name="name" required>

      <label for="prefectureSelect">都道府県を入力してください</label>
      <select id="prefectureSelect" name="prefectureCode" required>
        <option value="01">北海道</option>
        <option value="02">青森県</option>
        <option value="03">岩手県</option>
        <option value="04">宮城県</option>
        <option value="05">秋田県</option>
        <option value="06">山形県</option>
        <option value="07">福島県</option>
        <option value="08">茨城県</option>
        <option value="09">栃木県</option>
        <option value="10">群馬県</option>
        <option value="11">埼玉県</option>
        <option value="12">千葉県</option>
        <option value="13">東京都</option>
        <option value="14">神奈川県</option>
        <option value="15">新潟県</option>
        <option value="16">富山県</option>
        <option value="17">石川県</option>
        <option value="18">福井県</option>
        <option value="19">山梨県</option>
        <option value="20">長野県</option>
        <option value="21">岐阜県</option>
        <option value="22">静岡県</option>
        <option value="23">愛知県</option>
        <option value="24">三重県</option>
        <option value="25">滋賀県</option>
        <option value="26">京都府</option>
        <option value="27">大阪府</option>
        <option value="28">兵庫県</option>
        <option value="29">奈良県</option>
        <option value="30">和歌山県</option>
        <option value="31">鳥取県</option>
        <option value="32">島根県</option>
        <option value="33">岡山県</option>
        <option value="34">広島県</option>
        <option value="35">山口県</option>
        <option value="36">徳島県</option>
        <option value="37">香川県</option>
        <option value="38">愛媛県</option>
        <option value="39">高知県</option>
        <option value="40">福岡県</option>
        <option value="41">佐賀県</option>
        <option value="42">長崎県</option>
        <option value="43">熊本県</option>
        <option value="44">大分県</option>
        <option value="45">宮崎県</option>
        <option value="46">鹿児島県</option>
        <option value="47">沖縄県</option>
      </select>
      <input type="hidden" name="prefecture" id="prefecture">

      <label for="address">続きのご住所を入力してください</label>
      <input type="text" id="address" name="address" required>

      <label for="phoneNumber">電話番号を入力してください</label>
      <input type="text" id="phoneNumber" name="phoneNumber" required>

      <label for="email">メールアドレスを入力してください</label>
      <input type="text" id="email" name="email" required>

      <label for="drivingHistory">運転歴を入力してください（例：5年）</label>
      <input type="text" id="drivingHistory" name="drivingHistory" required>

      <label for="hasVehicle">軽配送車両をお持ちですか？</label>
      <select id="hasVehicle" name="hasVehicle" required>
        <option value="yes">あり</option>
        <option value="no">なし</option>
      </select>

      <label for="hasLicense">運転免許証はお持ちですか？</label>
      <select id="hasLicense" name="hasLicense" required>
        <option value="yes">あり</option>
        <option value="no">なし</option>
      </select>

      <button type="submit">送信</button>
    </form>
  </div>
  <script>
    const select = document.getElementById('prefectureSelect');
    const hidden = document.getElementById('prefecture');
    function updatePrefecture() {
      hidden.value = select.options[select.selectedIndex].text;
    }
    select.addEventListener('change', updatePrefecture);
    updatePrefecture();
  </script>
</body>
</html>`;
}

function getSuccessHtml() {
  return `<html>
            <head>
              <meta charset="utf-8">
              <title>送信完了</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
                .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                h1 { color: #00C300; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>送信完了</h1>
                <p>お問い合わせを受け付けました。<br>LINEにメッセージをお送りしました。</p>
              </div>
            </body>
          </html>`;
}

function getErrorHtml() {
  return `<html>
            <head><meta charset="utf-8"><title>エラー</title></head>
            <body>
              <h1>エラーが発生しました</h1>
              <p>メッセージの送信に失敗しました。</p>
            </body>
          </html>`;
}

export { getFormHtml, getSuccessHtml, getErrorHtml };
