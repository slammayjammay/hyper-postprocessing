// scales the image

// default 1.0
#ifndef scale
#define scale 1.0
#endif

void mainUv(inout vec2 uv) {
	uv -= 0.5;
	uv *= 1.0 / scale;
	uv += 0.5;
}
