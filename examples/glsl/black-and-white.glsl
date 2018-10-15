// turn all colors that aren't black to white
#define threshold 0.001

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	float hasRed = step(threshold, inputColor.r);
	float hasBlue = step(threshold, inputColor.g);
	float hasGreen = step(threshold, inputColor.b);

	float isNotBlack = clamp(hasRed + hasBlue + hasGreen, 0.0, 1.0);

	outputColor = mix(inputColor, vec4(1.0), isNotBlack);
}
