// adapted from https://github.com/Swordfish90/cool-retro-term/blob/master/app/qml/ShaderTerminal.qml

uniform lowp float pixelHeight;
uniform bool pixelization;

void mainImage(const in vec4 inputColor, const in vec2 fragCoord, out vec4 fragColor) {
	fragColor = inputColor;

	float val = 0.0;
	vec2 rasterizationCoords = fract(fragCoord * resolution * 0.0365 * pixelHeight);
	val += smoothstep(0.0, 0.5, rasterizationCoords.y);
	val -= smoothstep(0.5, 2.0 * 0.5, rasterizationCoords.y);
	fragColor *= mix(0.4, 1.0, val);

	if (pixelization) {
		val = 0.0;
		val += smoothstep(0.0, 0.5, rasterizationCoords.x);
		val -= smoothstep(0.5, 2.0 * 0.5, rasterizationCoords.x);
		fragColor *= mix(0.4, 1.0, val);
	}
}