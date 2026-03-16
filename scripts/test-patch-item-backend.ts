const fetch = require('node-fetch');

async function main() {
  const orderId = 'cmmsfhkpu000221slk9rweyxw';
  const itemId = 'cmmsflanb000721sl40sf10vk';
  const url = `http://localhost:3000/api/orders/${orderId}/items/${itemId}`;

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickedQuantity: 5 }),
    });

    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

main();
