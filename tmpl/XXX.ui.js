// Code to edit the dosing history
function cloneTmpl (sel) {
  return document.importNode(document.querySelector(sel).content, true);
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

function OD_key(event) {
  if (event.code == 'Backspace' &&
    event.type == 'keyup' && /* prevents key-repeat from clobbering the hx */
    event.target.selectionStart == 0 && /* already backspaced to start of field */
    document.querySelectorAll('section.history tr').length > 2) /* not deleting the last one */
  {
    var del_targ = event.target.parentNode.parentNode;
    var to_focus = del_targ.nextElementSibling || del_targ.previousElementSibling;
    del_targ.remove();
    to_focus.querySelector('input').focus();
  }

  if (event.code == 'Enter' && event.type == 'keyup') {
    var dup_targ = event.target.parentNode.parentNode;
    var new_el = dup_targ.cloneNode(true);
    new_el.querySelectorAll('input')[2] = ''; /* levels should never be duplicated */
    dup_targ.after(new_el);
    new_el.querySelectorAll('input')[0].focus();
  }
}
