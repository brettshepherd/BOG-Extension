(function init() {
  chrome.storage.sync.get("settings", async (result) => {
    // try to used saved setting if available, otherwise just enable everything
    let settings;
    if (!result.settings) {
      settings = {
        coinmarketcap: true,
        coingeko: true,
        bscscan: true,
        pancakeswap: true
      };
    } else {
      settings = result.settings;
    }

    let contractID;

    //coinmarketcap
    if (location.href.includes("coinmarketcap") && settings.coinmarketcap) {
      try {
        contractID = await coinMarketCap();
      } catch (e) {
        console.log(e);
      }
    }

    //coingeko
    else if (location.href.includes("coingecko") && settings.coingeko) {
      try {
        contractID = await coinGeko();
      } catch (e) {
        console.log(e);
      }
    }
    //bscscan
    else if (location.href.includes("bscscan") && settings.bscscan) {
      const urlSegments = location.href.split("/");
      contractID = urlSegments[urlSegments.length - 1].split(/#/)[0];
    }

    //pancakeswap
    else if (location.href.includes("pancakeswap") && settings.pancakeswap) {
      let result = {};
      const params = (window.location.href.split("?")[1] || "").split("&");
      params.forEach((param) => {
        const paramParts = param.split("=");
        result[paramParts[0]] = decodeURIComponent(paramParts[1] || "");
      });

      if (result && result["outputCurrency"]) {
        contractID = result["outputCurrency"];
      }
    }

    // if valid address is found, create UI
    if (contractID) {
      createUI(contractID);
    }
  });
})();

function coinMarketCap() {
  return new Promise(async (res, rej) => {
    // search for id in UI first
    const bscScanID = bscScanLinkSearch();
    if (bscScanID) {
      res(bscScanID);
      return;
    }

    console.log("Trying to fetch from coinGeko...");
    // otherwise try to grab id by url segments
    const urlSegments = location.href.split("/");
    // name comes after "currencies" segment
    const currenciesSegIndex = urlSegments.findIndex((i) => i === "currencies");
    const tokenName = urlSegments[currenciesSegIndex + 1];
    try {
      const result = await fetchCoinDataByName(tokenName);
      res(result);
    } catch (e) {
      rej(e);
    }
  });
}

function coinGeko() {
  return new Promise(async (res, rej) => {
    // search for contractID in UI first
    const bscScanID = bscScanLinkSearch();
    if (bscScanID) {
      res(bscScanID);
      return;
    }

    console.log("Trying to fetch from coinGeko...");
    // otherwise try to grab id by url segments
    const urlSegments = location.href.split("/");
    // name comes after "coins" segment for english, and translated versions for other languages
    const currenciesSegIndex = urlSegments.findIndex((i) => i === "coins");
    const tokenName = urlSegments[currenciesSegIndex + 1].split(/#/)[0];
    try {
      const result = await fetchCoinDataByName(tokenName);
      res(result);
    } catch (e) {
      rej(e);
    }
  });
}

// Use Coingeko API to try searching for coin address by name
function fetchCoinDataByName(name) {
  return new Promise((res, rej) => {
    fetch(
      `https://api.coingecko.com/api/v3/coins/${name}?tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`
    )
      .then((data) => data.json())
      .catch(rej)
      .then((json) => {
        const contractID = json.platforms["binance-smart-chain"];
        res(contractID);
      })
      .catch(rej);
  });
}

// Load html and add click listeners
function createUI(contractID) {
  fetch(chrome.runtime.getURL("widget/widget.html"))
    .then((r) => r.text())
    .then((html) => {
      document.body.insertAdjacentHTML("beforeend", html);

      // fix image links
      const container = document.querySelector(".bogged-finance-extension");
      container.querySelectorAll("img").forEach((img) => {
        img.src = chrome.runtime.getURL(img.dataset.src);
      });

      // add click listeners
      const chartsBtn = container.querySelector(
        ".bogged-finance-extension-buttons-charts"
      );
      const orderBtn = container.querySelector(
        ".bogged-finance-extension-buttons-order"
      );
      chartsBtn.onclick = () => {
        chrome.runtime.sendMessage({ message: "open_chart", contractID });
      };
      orderBtn.onclick = () => {
        chrome.runtime.sendMessage({ message: "open_buy", contractID });
      };
    });
}

// Search for BscScan Link
function bscScanLinkSearch() {
  let id;
  const linkElem = document.querySelector(`a[href^='https://bscscan.com/']`);
  if (linkElem) {
    const linkSegments = linkElem.href.split("/");
    const linkID = linkSegments[linkSegments.length - 1];

    // check if it is a valid address format
    if (linkID && linkID.length === 42) {
      id = linkID;
    }
  }
  return id;
}
