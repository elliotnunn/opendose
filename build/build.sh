#!/bin/bash

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

set -euo pipefail

baypk="$(cd "$(dirname "$1")"; pwd)/$(basename "$1")"
cd "$(dirname "$0")"; cd .. # cd to opendose directory

rm -f *.html *.js *.wasm *.css || true # Don't worry, it's fiiiiine

engines="`ls "$baypk"/macros | sed 's/.h$//'`"

cp "$baypk"/macros/* ./
cp tmpl/* ./

for engine in $engines; do
	echo Engine: $engine

	cp "$baypk"/bin/$engine.{js,wasm} ./

	for xxx in *XXX*; do
		yyy=`echo $xxx | sed s/XXX/$engine/`
		cpp -include $engine.h -I. -P -C $xxx - | sed 's/"*<DELQUOT>"*//g' | sed 's/<PUTQUOT>/"/g' | sed s/XXX/$engine/g > $yyy
	done
done

rm *.h
rm *XXX*
