#!/bin/sh

PREFIX=baypk_

mkdir -p bin/ macros/

for mod in mod_*.inc; do
	base=`echo $mod | sed 's/^....//' | sed 's/....$//'`

	inputfiles="-include $mod main.c"

	gcc -o bin/$base -O2 $inputfiles
	gcc -dM -E -o /dev/stdout $inputfiles | grep '^#define \(MOD\|SOL\)_' > macros/$base.h
done
