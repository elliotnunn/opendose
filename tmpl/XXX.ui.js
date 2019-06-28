/*
  This file is part of Open Dose.

  Copyright (C) 2019 Elliot Nunn

  This program is free software: you can redistribute it and/or  modify
  it under the terms of the GNU Affero General Public License, version 3,
  as published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
  /* This state machine only deletes rows when user backspaces at position zero */
  if (event.code == 'Backspace') {
    event.target.OD_state = event.target.OD_state || 0;

    if (event.type == 'keydown' && !event.target.OD_state) {
      var is_txt_del = event.target.selectionEnd > 0;
      event.target.OD_state = is_txt_del ? 1 : 2;
    }

    if (event.type == 'keyup') {
      if (event.target.OD_state == 2 && document.querySelectorAll('section.history tr').length > 2) {
        var del_targ = event.target.parentNode.parentNode;
        var to_focus = del_targ.nextElementSibling || del_targ.previousElementSibling;
        del_targ.remove();
        to_focus.querySelector('input').focus();
      }

      event.target.OD_state = 0;
    }
  }

  if (event.code == 'Enter' && event.type == 'keyup') {
    var dup_targ = event.target.parentNode.parentNode;
    var new_el = dup_targ.cloneNode(true);
    new_el.querySelectorAll('input')[2].value = ''; /* levels should never be duplicated */

    if (new_el.querySelectorAll('input')[3].value != '') {
      new_el.querySelectorAll('input')[3].value = '"'; /* doses should be replaced with ditto */
    }

    dup_targ.after(new_el);
    new_el.querySelectorAll('input')[0].focus();
  }
}
