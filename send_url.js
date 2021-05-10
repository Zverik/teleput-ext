function testKey() {
  chrome.storage.sync.get('teleputKey', stored => {
    if (!stored || !stored.teleputKey) {
      chrome.runtime.openOptionsPage();
      window.close();
    }
  });
}

async function sendUrlAsync(url, key) {
  let desc = document.getElementById('teleput_send_desc').value.trim();
  const params = {
    key: key,
    text: desc ? desc + '\n\n' + url : url
  };
  const options = {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' }
  };
  response = await window.fetch('https://teleput.textual.ru/post', options);
  if (!response.ok)
    document.getElementById('error').innerText = 'Error: ' + response.statusText;
  else
    window.close();
}

function sendUrl() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs) {
      chrome.storage.sync.get('teleputKey', stored => {
        if (!stored || !stored.teleputKey) {
          chrome.runtime.openOptionsPage();
          window.close();
        }
        else
          sendUrlAsync(tabs[0].url, stored.teleputKey);
      });
    }
  });
}

document.getElementById('teleput_send_button').addEventListener('click', sendUrl);
document.addEventListener('DOMContentLoaded', testKey);
document.getElementById('teleput_send_desc').focus();
