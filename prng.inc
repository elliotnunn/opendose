#pragma once

/* https://www.thecodingforums.com/threads/64-bit-kiss-rngs.673657 */

#define MWC (prng_t=(state->x<<58)+state->c, state->c=(state->x>>6), state->x+=prng_t, state->c+=(state->x<prng_t), state->x)
#define XSH ( state->y^=(state->y<<13), state->y^=(state->y>>17), state->y^=(state->y<<43) )
#define CNG ( state->z=6906969069LL*state->z+1234567 )
#define KISS (MWC+XSH+CNG)

struct prng64_state {
    uint64_t x;
    uint64_t c;
    uint64_t y;
    uint64_t z;
};

struct prng64_state new_prng64(void)
{
    return (struct prng64_state){.x=1234567890987654321ULL, .c=123456123456123456ULL, .y=362436362436362436ULL, .z=1066149217761810ULL};
}

uint64_t prng64(struct prng64_state *state)
{
    uint64_t prng_t;
    return KISS;
}
