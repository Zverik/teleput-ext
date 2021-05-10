function createContextMenus() {
  chrome.contextMenus.removeAll(function() {
    const menus = [
      { id: "send-url", title: "Send this link to Telegram", contexts: ["link"] },
      { id: "send-selection", title: "Send selection to Telegram", contexts: ["selection"] },
      // { id: "send-photo", title: "Send photo to Telegram", contexts: ["image"] },
      // { id: "send-audio", title: "Send audio to Telegram", contexts: ["audio"] },
      // { id: "send-video", title: "Send video to Telegram", contexts: ["video"] },
      { id: "send-media-url", title: "Send media URL to Telegram",
        contexts: ["image", "audio", "video"] }
    ];
    for (let menu of menus) {
      chrome.contextMenus.create(menu);
    }
  });
}

function handleContextMenuWithKey(info, tab, key) {
  let params = { key: key };
  let media = null;
  let mime = null;

  switch (info.menuItemId) {
    case "send-url":
      if (info.linkText && info.linkText != info.linkUrl)
        params['text'] = info.linkText + ': ' + info.linkUrl
      else
        params['text'] = info.linkUrl
      break;
    case "send-selection":
      params['text'] = info.selectionText + '\n\n' + info.pageUrl;
      break;
    case "send-photo":
      mime = 'image/jpeg'; // Doesn't really matter which format
      media = true;
      break;
    case "send-audio":
      mime = 'audio/mpeg';
      media = true;
      break;
    case "send-video":
      mime = 'video/mp4';
      media = true;
      break;
    case "send-media-url":
      params['text'] = info.srcUrl;
  }

  if (media) {
    params['text'] = 'From ' + info.pageUrl;
    // Try downloading first
    window.fetch(info.srcUrl)
      .then(response => response.blob())
      .then(content => {
        const formData = new FormData();
        for (let k in params)
          formData.append(k, params[k]);
        formData.append('media', content);
        return { method: 'POST', body: formData };
      }).then(options => {
        return window.fetch('https://teleput.textual.ru/upload', options);
      })
      .catch(error => {
        console.error('Error uploading file', error);
        params['media_url'] = info.srcUrl;
        if (mime)
          params['mime'] = mime;
        const options = {
          method: 'POST',
          body: JSON.stringify(params),
          headers: { 'Content-Type': 'application/json' }
        };
        return window.fetch('https://teleput.textual.ru/post', options);
      });
  } else if (params.text) {
    const options = {
      method: 'POST',
      body: JSON.stringify(params),
      headers: { 'Content-Type': 'application/json' }
    };
    window.fetch('https://teleput.textual.ru/post', options)
      .then(response => {
        if (!response.ok)
          console.error('Teleput server error: ' + response.statusText);
      })
      .catch(err => { console.error('Failed to send', err); });
  } else {
    console.error('What should I do? id=' + info.menuItemId +
      ", params=" + JSON.stringify(params))
  }
}

function handleContextMenu(info, tab) {
  chrome.storage.sync.get('teleputKey', stored => {
    if (!stored || !stored.teleputKey) {
      chrome.runtime.openOptionsPage();
      return;
    }
    handleContextMenuWithKey(info, tab, stored.teleputKey);
  });
}

(function() {
  try {
    createContextMenus();
    chrome.contextMenus.onClicked.addListener(handleContextMenu);
  } catch (err) {
    console.error('Failed to set up context menu', err);
  }
})();
