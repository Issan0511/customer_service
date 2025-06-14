import 'dotenv/config';
import { fetchDeals } from './src/deals.js';
import fetch from 'node-fetch';

async function testDeals() {
  const sample = {
    userId: 'U351c1fecfb559f769313b731b84ac07f',
    name: '中塚一瑳',
    prefectureCode: '13',
    prefecture: '東京都',
    hasVehicle: 'yes',
    reward: '10088'
  };

  console.log('GASからの生レスポンステキストを取得中...');
  const rawRes = await fetch(process.env.GAS_URL);
  const rawText = await rawRes.text();
  console.log('Raw response text from GAS:');
  console.log(rawText);

  console.log('fetchDeals()で取得した案件データを取得中...');
  const deals = await fetchDeals();
  console.log(`Fetched ${deals.length} deals`);
  console.log('Raw deals from GAS:', JSON.stringify(deals, null, 2));

  const matched = deals.filter(d => {
    if (typeof d.code === 'string') {
      try {
        const codes = JSON.parse(d.code);
        return Array.isArray(codes) && codes.includes(sample.prefectureCode);
      } catch (_) {
        return false;
      }
    } else if (Array.isArray(d.code)) {
      return d.code.includes(sample.prefectureCode);
    }
    return false;
  });

  if (matched.length > 0) {
    console.log(`都道府県コード ${sample.prefectureCode} にマッチする案件が見つかりました:`, JSON.stringify(matched, null, 2));
  } else {
    console.log(`都道府県コード ${sample.prefectureCode} の案件は見つかりませんでした。`);
  }
}

testDeals().catch(console.error);
