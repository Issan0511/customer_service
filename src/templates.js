function getFormHtml(userId = '') {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Customer Service Form</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
    .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; text-align: center; }
    label { display: block; margin: 15px 0 5px; font-weight: bold; }
    input[type="text"] { width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px; }
    button { background-color: #00C300; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; width: 100%; margin-top: 20px; }
    button:hover { background-color: #00A300; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Customer Service Form</h1>
    <form method="POST" action="/submit">
      <input type="hidden" name="userId" value="${userId}">
      <label>お名前:</label>
      <input type="text" name="name" required>

      <label>居住地</label>
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

      <label>車両の有無:</label>
      <select name="hasVehicle" required>
        <option value="yes">あり</option>
        <option value="no">なし</option>
      </select>

      <label>報酬希望:</label>
      <input type="text" name="reward" required>

</button>
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

module.exports = { getFormHtml, getSuccessHtml, getErrorHtml };
