import fetch from 'node-fetch';

const GAS_URL = process.env.GAS_URL;
const BOOKING_URL = process.env.BOOKING_URL || 'https://www.jicoo.com/t/wwxWIHEMKYUM/e/W4tjGZr5';

async function fetchDeals() {
  try {
    const res = await fetch(GAS_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'CustomerService/1.0',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    if (!res.ok) {
      return [];
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data && data.status === 'success' && data.data !== undefined) {
        return Array.isArray(data.data) ? data.data : [];
      } else if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (e) {
      return [];
    }
  } catch (e) {
    return [];
  }
}

function createDealCarousel(deals) {
  return {
    type: 'flex',
    altText: '案件情報',
    contents: {
      type: 'carousel',
      contents: deals.slice(0, 10).map(d => ({
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            { type: 'text', text: d.rawtext || JSON.stringify(d), wrap: true }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'uri',
                label: '案件を受ける',
                uri: BOOKING_URL
              }
            }
          ]
        }
      }))
    }
  };
}

export { fetchDeals, createDealCarousel };
