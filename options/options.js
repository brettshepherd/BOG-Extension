const options = document.querySelectorAll(".option");

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
      console.log(settings);
      chrome.storage.sync.set({ settings });
    });
  });
});

// // Saves options to chrome.storage
// function save_options() {
//   var color = document.getElementById("color").value;
//   var likesColor = document.getElementById("like").checked;
//   chrome.storage.sync.set(
//     {
//       favoriteColor: color,
//       likesColor: likesColor
//     },
//     function () {
//       // Update status to let user know options were saved.
//       var status = document.getElementById("status");
//       status.textContent = "Options saved.";
//       setTimeout(function () {
//         status.textContent = "";
//       }, 750);
//     }
//   );
// }

// // Restores select box and checkbox state using the preferences
// // stored in chrome.storage.
// function restore_options() {
//   // Use default value color = 'red' and likesColor = true.
//   chrome.storage.sync.get(
//     {
//       favoriteColor: "red",
//       likesColor: true
//     },
//     function (items) {
//       document.getElementById("color").value = items.favoriteColor;
//       document.getElementById("like").checked = items.likesColor;
//     }
//   );
// }
// document.addEventListener("DOMContentLoaded", restore_options);
// document.getElementById("save").addEventListener("click", save_options);
