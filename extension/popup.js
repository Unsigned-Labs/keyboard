document.addEventListener("DOMContentLoaded", function () {
  const toggleSwitch = document.getElementById("toggleSwitch");
  const statusText = document.getElementById("status");

  chrome.runtime.sendMessage({ action: "getState" }, (response) => {
    toggleSwitch.checked = response.isEnabled;
    statusText.textContent = response.isEnabled ? "Enabled" : "Disabled";
  });

  toggleSwitch.addEventListener("change", function () {
    chrome.runtime.sendMessage({ action: "toggleState" }, (response) => {
      statusText.textContent = response.isEnabled ? "Enabled" : "Disabled";
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "stateChanged",
          isEnabled: response.isEnabled,
        });
      });
    });
  });
});
