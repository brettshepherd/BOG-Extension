chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "open_chart") {
    chrome.tabs.create({
      url: `https://charts.bogged.finance/?token=${request.contractID}`
    });
  } else if (request.message === "open_buy") {
    chrome.tabs.create({
      url: `https://bogged.finance/swap?token=${request.contractID}`
    });
  }
});
