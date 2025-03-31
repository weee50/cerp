class MersenneRNG {
    constructor(seed) {
        this.state = new Array(624).fill(0)
        this.f = 1812433253
        this.m = 397
        this.u = 11
        this.s = 7
        this.b = 0x9D2C5680
        this.t = 15
        this.c = 0xEFC60000
        this.l = 18
        this.index = 624
        this.lower_mask = (1<<31)-1
        this.upper_mask = 1<<31

        // update state
        this.state[0] = seed
        for (let i = 1; i < 624; i++) {
            this.state[i] = this.int_32(this.multiply_uint32(this.f, (this.state[i-1]^(this.state[i-1]>>>30))) + i)
		}
	}

    twist() {
        for (let i = 0; i < 624; i++) {
            let temp = this.int_32((this.state[i]&this.upper_mask)+(this.state[(i+1)%624]&this.lower_mask))
            let temp_shift = temp>>>1
            if (temp%2 != 0) {
                temp_shift = temp_shift^0x9908b0df
			}
            this.state[i] = this.state[(i+this.m)%624]^temp_shift
		}
        this.index = 0
	}

    get_random_number() {
        if (this.index >= 624) {
            this.twist()
		}
        let y = this.state[this.index]
        y = y^(y>>>this.u)
        y = y^((y<<this.s)&this.b)
        y = y^((y<<this.t)&this.c)
        y = y^(y>>>this.l)
        this.index+=1
        return this.int_32(y)
	}

	randrange(a, b) {
		return Math.floor((this.get_random_number() / (2 ** 32)) * (b - a) + a)
	}

    int_32(number) {
        return (number + 0x100000000) % 0x100000000
	}

	multiply_uint32(a, b) {
		if (a < 0) {a += 0x100000000};
		if (b < 0) {b += 0x100000000};
		var ah = (a >> 16) & 0xffff, al = a & 0xffff;
		var bh = (b >> 16) & 0xffff, bl = b & 0xffff;
		var high = ((ah * bl) + (al * bh)) & 0xffff;
		return (((high << 16)>>>0) + (al * bl)) % 0x100000000;
	}
}