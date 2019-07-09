// adapted from https://github.com/Swordfish90/cool-retro-term/blob/master/app/qml/ShaderTerminal.qml

uniform lowp sampler2D noiseSource;
uniform lowp vec2 jitterDisplacement;

void mainImage(const in vec4 inputColor, const in vec2 fragCoord, out vec4 fragColor) {
	vec4 noiseTexel = texture2D(noiseSource, resolution / (vec2(512, 512) * 0.75) * fragCoord + vec2(fract(time * 1000.0 / 51.0), fract(time * 1000.0 / 237.0)));

	vec2 offset = vec2(noiseTexel.b, noiseTexel.a) - vec2(0.5);
	vec2 txt_coords = fragCoord + offset * jitterDisplacement;

	fragColor = texture2D(inputBuffer, txt_coords);
}
