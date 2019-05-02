// Code to edit the dosing history
function OD_new_dose (caller) {
  html = 
    '<div class="list-group-item OD-inputline-dose"><form class="form-inline">' +
      '<div class="input-group input-group-sm mx-1">' +
        '<button class="btn btn-danger btn-sm OD-editmode" onclick="OD_enter_dirtymode(); this.parentNode.parentNode.parentNode.remove();">Del</button>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">day/time</span>' +
        '</div>' + 
        '<input type="text" onclick="OD_enter_dirtymode();" class="form-control OD-input-date" size="4" value="1"></input>' +
        '<input type="text" onclick="OD_enter_dirtymode();" class="form-control OD-input-time" size="4" value="0000"></input>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<input type="text" onclick="OD_enter_dirtymode();" class="form-control OD-input-dose" size="4" value="1000"></input>' +
        '<div class="input-group-append">' +
          '<span class="input-group-text">' + MOD_DRUG_UNIT + '</span>' +
        '</div>' + 
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">given over</span>' +
        '</div>' + 
        '<input type="text" onclick="OD_enter_dirtymode();" class="form-control OD-input-dosepush" size="4" value="1"></input>' +
        '<div class="input-group-append">' +
          '<span class="input-group-text">' + MOD_TIME_UNIT + '</span>' +
        '</div>' + 
      '</div>' +
    '</form></div>';

  document.querySelector(".OD-insertbeforeme").insertAdjacentHTML("beforebegin", html);
}

function OD_new_level (caller) {
  html = 
    '<div class="list-group-item OD-inputline-level"><form class="form-inline">' +
      '<div class="input-group input-group-sm mx-1">' +
        '<button class="btn btn-danger btn-sm OD-editmode" onclick="OD_enter_dirtymode(); this.parentNode.parentNode.parentNode.remove();">Del</button>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">day/time</span>' +
        '</div>' + 
        '<input type="text" onclick="OD_enter_dirtymode();" class="form-control OD-input-date" size="4" value="1"></input>' +
        '<input type="text" onclick="OD_enter_dirtymode();" class="form-control OD-input-time" size="4" value="0000"></input>' +
      '</div>' +
      '<div class="input-group input-group-sm mx-1">' +
        '<div class="input-group-prepend">' +
          '<span class="input-group-text">TDM level</span>' +
        '</div>' + 
        '<input type="text" onclick="OD_enter_dirtymode();" class="form-control OD-input-level" size="3" value="0"></input>' +
        '<div class="input-group-append">' +
          '<span class="input-group-text">mg/L</span>' +
        '</div>' + 
      '</div>' +
    '</form></div>';

  document.querySelector(".OD-insertbeforeme").insertAdjacentHTML("beforebegin", html);
}

function OD_enter_dirtymode(caller, validator) {
  document.querySelector("#dirty-btn").hidden = false;
}

function OD_exit_dirtymode(caller, validator) {
  document.querySelector("#dirty-btn").hidden = true;
}
