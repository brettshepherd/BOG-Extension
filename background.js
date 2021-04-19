// chrome.runtime.onInstalled.addListener( ()=> {
//   chrome.contextMenus.create({
//     "id": "sampleContextMenu",
//     "title": "Sample Context Menu",
//     "contexts": ["selection"]
//   });
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "open_chart") {
    chrome.tabs.create({
      url: `https://charts.bogged.finance/?token=${request.contractID}`
    });
  } else if (request.message === "open_buy") {
    chrome.tabs.create({
      url: `https://bogged.finance/trade?token=${request.contractID}`
    });
  }
});
