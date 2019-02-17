#!/bin/sh

PREFIX=baypk_

CCOPTS="-std=c99 -O2 -Wall -Werror -Wextra -pedantic"

mkdir -p bin/ macros/

for mod in mod_*.inc; do
	base=`echo $mod | sed 's/^....//' | sed 's/....$//'`

	inputfiles="-include $mod main.c"

	gcc -o bin/$base $CCOPTS $inputfiles
	gcc -dM -E -o /dev/stdout $CCOPTS $inputfiles | grep '^#define \(MOD\|SOL\)_' > macros/$base.h
done
