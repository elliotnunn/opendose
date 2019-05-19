// Code to edit the dosing history
function OD_new_dose (caller) {
  document.querySelector(".OD-appendtome").insertBefore(document.querySelector("#dose").content.cloneNode(true), document.querySelector(".OD-insertbeforeme"));
}

function OD_new_level (caller) {
  document.querySelector(".OD-appendtome").insertBefore(document.querySelector("#level").content.cloneNode(true), document.querySelector(".OD-insertbeforeme"));
}

function OD_enter_dirtymode(caller, validator) {
  document.querySelectorAll(".OD-dirtyvis").forEach(function (x) {x.hidden = false});
}

function OD_exit_dirtymode(caller, validator) {
  document.querySelectorAll(".OD-dirtyvis").forEach(function (x) {x.hidden = true});

  var durationel = document.querySelector(".OD-input-period")
  document.querySelectorAll(".OD-input-date").forEach(function (x) {
    if (parseInt(x.value) > parseInt(durationel.value)) {
      durationel.value = x.value;
    }
  })
}
