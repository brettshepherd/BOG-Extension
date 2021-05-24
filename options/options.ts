const options = document.querySelectorAll<HTMLButtonElement>(".option");

chrome.storage.sync.get("settings", (result) => {
  // get saved settings from storage ,and set default if not available
  let settings;
  if (!result.settings) {
    // set defaults and save
    settings = {
      coinmarketcap: true,
      coingeko: true,
      bscscan: true,
      pancakeswap: true
    };
    chrome.storage.sync.set({ settings });
  } else {
    // set from saved settings
    settings = result.settings;
  }

  // set options elements to proper state
  options.forEach((option) => {
    const id = option.dataset.id;
    //   add active class based on current settings
    option.classList.toggle("active", settings[id]);

    //   add click listener to button
    const button = option.querySelector("button");
    button.addEventListener("click", () => {
      //   toggle active state, change class, and save
      const newState = !settings[id];
      option.classList.toggle("active", newState);
      settings[id] = newState;
      chrome.storage.sync.set({ settings });
    });
  });
});
