"use strict";
/* global browser, document */
var background = browser.extension.getBackgroundPage();

async function saveOptions(e) {
  e.preventDefault();
  let settings = {};

  if (!validateKeys()) {
    return;
  }

  let element;
  let value;
  for (let setting of background.optionNames) {
    element = document.querySelector("#" + setting);
    if (element.type == "checkbox") {
      value = element.checked;
    } else {
      value = element.value;
    }
    // Only save values set to a new, non-empty value
    if (value != background.defaults[setting] && value != "") {
      settings[setting] = value;
    }
  }
  await browser.storage.local.set(settings);
  for (let setting of background.optionNames) {
    if (!settings.hasOwnProperty(setting)) {
      await browser.storage.local.remove(setting);
    }
  }
  await background.applyKeys();
  await restoreOptions();
}

async function restoreOptions() {
  let settings = await background.getSettings();
  let element;
  for (let setting in settings) {
    element = document.querySelector("#" + setting);
    if (element.type == "checkbox") {
      element.checked = settings[setting];
    } else {
      element.value = settings[setting];
    }
  }
}

async function restoreDefaults(e) {
  e.preventDefault();
  await browser.storage.local.remove(background.optionNames);
  await restoreOptions();
}

async function unsetSingleKeys(e) {
  e.preventDefault();
  let settings = await browser.storage.local.get("mainkeys");
  if (!settings.hasOwnProperty("mainkeys")) {
    settings.mainkeys = background.defaults.mainkeys;
  }
  let keys = JSON.parse(settings.mainkeys);
  let singles = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "a",
    "b",
    "c",
    "f",
    "j",
    "k",
    "m",
    "o",
    "p",
    "r",
    "s",
    "t",
    "u",
    "w",
    "x",
    "#",
    "]",
    "[",
  ];
  for (let key of singles) {
    if (!keys.hasOwnProperty(key)) {
      keys[key] = "unset";
    }
  }
  await browser.storage.local.set({ mainkeys: JSON.stringify(keys, null, 4) });
  await background.applyKeys();
  await restoreOptions();
}

function validateKeys() {
  let keysFields = document.querySelectorAll(".json");
  let valid = true;
  for (let keysField of keysFields) {
    try {
      if (keysField.value != "") {
        JSON.parse(keysField.value);
      }
      keysField.setCustomValidity("");
    } catch (err) {
      keysField.setCustomValidity("Invalid JSON");
      valid = false;
    }
  }
  return valid;
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#save").addEventListener("submit", saveOptions);
document.querySelector("#restore").addEventListener("submit", restoreDefaults);
document.querySelector("#unset").addEventListener("submit", unsetSingleKeys);
