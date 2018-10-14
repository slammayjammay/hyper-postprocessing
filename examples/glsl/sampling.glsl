// if uv is outside the bounds of 0 to 1, instead sets the output color to the
// "outOfBoundsColor" define.

// defaults to black
#ifndef outOfBoundsColor
#define outOfBoundsColor vec4(0.0, 0.0, 0.0, 1.0)
#endif

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	float isOutOfBounds = step(0.0, uv.x) * step(-1.0, -uv.x) * step(0.0, uv.y) * step(-1.0, -uv.y);
	outputColor = mix(outOfBoundsColor, inputColor, isOutOfBounds);
}
