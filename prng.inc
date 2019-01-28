#pragma once

/* https://www.thecodingforums.com/threads/64-bit-kiss-rngs.673657 */

static uint64_t
prng_x=1234567890987654321ULL,prng_c=123456123456123456ULL,
prng_y=362436362436362436ULL,prng_z=1066149217761810ULL,prng_t;

#define MWC (prng_t=(prng_x<<58)+prng_c, prng_c=(prng_x>>6), prng_x+=prng_t, prng_c+=(prng_x<prng_t), prng_x)
#define XSH ( prng_y^=(prng_y<<13), prng_y^=(prng_y>>17), prng_y^=(prng_y<<43) )
#define CNG ( prng_z=6906969069LL*prng_z+1234567 )
#define KISS (MWC+XSH+CNG)

uint64_t prng64(void)
{
    return KISS;
}
