#!/bin/bash

set -euo pipefail

baypk="$(cd "$(dirname "$1")"; pwd)/$(basename "$1")"
cd "$(dirname "$0")"; cd .. # cd to opendose directory

rm -f *.html *.js *.wasm *.css || true # Don't worry, it's fiiiiine

engines="`ls "$baypk"/macros | sed 's/.h$//'`"

cp "$baypk"/macros/* ./
cp tmpl/*XXX* ./

for engine in $engines; do
	echo Engine: $engine

	cp "$baypk"/bin/$engine.{js,wasm} ./

	for xxx in *XXX*; do
		yyy=`echo $xxx | sed s/XXX/$engine/`
		cpp -include $engine.h -I. -P -C $xxx - | sed 's!<DESTRING>"\([^"]*\)"</DESTRING>!\1!g' | sed s/XXX/$engine/g > $yyy
	done
done

rm *.h
rm *XXX*
