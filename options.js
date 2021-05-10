function restoreKey() {
  chrome.storage.sync.get('teleputKey', res => {
    document.getElementById('key').value = res ? res.teleputKey || '' : '';
  })
}

document.addEventListener('DOMContentLoaded', restoreKey);

document.getElementById('keyform').addEventListener('submit', (e) => {
  var props = { teleputKey: document.getElementById('key').value };
  chrome.storage.sync.set(props, res => {
    if (chrome.runtime.lastError)
      console.error('Failed to write the key', chrome.runtime.lastError);
  });
  e.preventDefault();
});
