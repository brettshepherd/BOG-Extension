// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener((tab) => {
  // Send a message to the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {
      message: "clicked_browser_action"
    });
  });
});

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