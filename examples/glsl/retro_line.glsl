// adapted from https://github.com/Swordfish90/cool-retro-term/blob/master/app/qml/ShaderTerminal.qml

uniform highp float glowingLine;

float randomPass(vec2 coords) {
	return fract(smoothstep(0.0, -120.0, coords.y - (resolution.y + 120.0) * fract(-time * 0.15)));
}

void mainImage(const in vec4 inputColor, const in vec2 fragCoord, out vec4 fragColor) {
	fragColor = inputColor + randomPass(fragCoord * resolution) * glowingLine * 0.2;
}
