#!/bin/sh

# This file is part of Open Dose.
#
# Copyright (C) 2019 Elliot Nunn
#
# This program is free software: you can redistribute it and/or  modify
# it under the terms of the GNU Affero General Public License, version 3,
# as published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

PREFIX=baypk_

CCOPTS="-std=c99 -O2 -Wall -Werror -Wextra -pedantic"

mkdir -p bin/ macros/

for mod in mod_*.inc; do
	base=`echo $mod | sed 's/^....//' | sed 's/....$//'`

	inputfiles="-include $mod main.c"

	gcc -o bin/$base $CCOPTS $inputfiles
	emcc -o bin/$base.js $CCOPTS $inputfiles
	gcc -dM -E -o /dev/stdout $CCOPTS $inputfiles | grep '^#define \(MOD\|SOL\)_' > macros/$base.h
done
