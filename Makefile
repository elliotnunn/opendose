all:
	cc -o bin.sim -include mod_vancomycin_thomson_2009.c main.c
	cc -o bin.bayes -DBAYES -include mod_vancomycin_thomson_2009.c main.c
