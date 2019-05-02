// Code to edit the dosing history
function OD_new_dose (caller) {
  while (!caller.classList.contains("OD-editable")) caller = caller.parentElement;

  caller = caller.querySelectorAll(".OD-appendtome")[0];

  html = 
    '<div class="list-group-item OD-inputline-dose"><form class="form-inline">' +
      '<div class="input-group input-group-sm mx-1">' +
        '<button class="btn btn-danger btn-sm OD-editmode" onclick="this.parentNode.parentNode.parentNode.remove()">Del</button>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">day/time</span>' +
        '</div>' + 
        '<input type="text" class="form-control OD-input-date" size="4" value="1"></input>' +
        '<input type="text" class="form-control OD-input-time" size="4" value="0000"></input>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<input type="text" class="form-control OD-input-dose" size="4" value="1000"></input>' +
        '<div class="input-group-append">' +
          '<span class="input-group-text">' + MOD_DRUG_UNIT + '</span>' +
        '</div>' + 
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">given over</span>' +
        '</div>' + 
        '<input type="text" class="form-control OD-input-dosepush" size="4" value="1"></input>' +
        '<div class="input-group-append">' +
          '<span class="input-group-text">' + MOD_TIME_UNIT + '</span>' +
        '</div>' + 
      '</div>' +
    '</form></div>';

  caller.insertAdjacentHTML("beforeend", html);
}

function OD_new_level (caller) {
  while (!caller.classList.contains("OD-editable")) caller = caller.parentElement;

  caller = caller.querySelectorAll(".OD-appendtome")[0];

  html = 
    '<div class="list-group-item OD-inputline-level"><form class="form-inline">' +
      '<div class="input-group input-group-sm mx-1">' +
        '<button class="btn btn-danger btn-sm OD-editmode" onclick="this.parentNode.parentNode.parentNode.remove()">Del</button>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">day/time</span>' +
        '</div>' + 
        '<input type="text" class="form-control OD-input-date" size="4" value="1"></input>' +
        '<input type="text" class="form-control OD-input-time" size="4" value="0000"></input>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">TDM level</span>' +
        '</div>' + 
        '<input type="text" class="form-control OD-input-level" size="3" value="0"></input>' +
        '<div class="input-group-append">' +
          '<span class="input-group-text">mg/L</span>' +
        '</div>' + 
      '</div>' +
    '</form></div>';

  caller.insertAdjacentHTML("beforeend", html);
}

function OD_enter_editmode(caller, validator) {
  while (!caller.classList.contains("OD-editable")) caller = caller.parentElement;
  console.log("Entering edit mode");

  /* Switch off "readOnly" on all editable fields */
  var list = caller.querySelectorAll("input");
  for (var i = 0; i < list.length; i++) {
    list[i].readOnly = false;
  }

  /* Switch off "disabled" on OD-editmode buttons */
  var list = caller.querySelectorAll(".OD-editmode");
  for (var i = 0; i < list.length; i++) {
    list[i].disabled = false;
  }

  /* Switch on "disabled" on OD-noteditmode buttons */
  var list = caller.querySelectorAll(".OD-noteditmode");
  for (var i = 0; i < list.length; i++) {
    list[i].disabled = true;
  }
}

function OD_exit_editmode(caller, validator) {
  while (!caller.classList.contains("OD-editable")) caller = caller.parentElement;
  console.log("Exiting edit mode");

  /* Switch on "readOnly" on all editable fields */
  var list = caller.querySelectorAll("input");
  for (var i = 0; i < list.length; i++) {
    list[i].readOnly = true;
  }

  /* Switch on "disabled" on OD-editmode buttons */
  var list = caller.querySelectorAll(".OD-editmode");
  for (var i = 0; i < list.length; i++) {
    list[i].disabled = true;
  }

  /* Switch off "disabled" on OD-noteditmode buttons */
  var list = caller.querySelectorAll(".OD-noteditmode");
  for (var i = 0; i < list.length; i++) {
    list[i].disabled = false;
  }
}
