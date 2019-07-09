// adapted from https://github.com/Swordfish90/cool-retro-term/blob/master/app/qml/ShaderTerminal.qml

uniform lowp float rbgShift;

void mainImage(const in vec4 inputColor, const in vec2 fragCoord, out vec4 fragColor) {
	vec3 txt_color = texture2D(inputBuffer, fragCoord).rgb;
	vec2 displacement = vec2(12.0, 0.0) * rbgShift / resolution;
	vec3 rightColor = texture2D(inputBuffer, fragCoord + displacement).rgb;
	vec3 leftColor = texture2D(inputBuffer, fragCoord - displacement).rgb;
	txt_color.r = leftColor.r * 0.10 + rightColor.r * 0.30 + txt_color.r * 0.60;
	txt_color.g = leftColor.g * 0.20 + rightColor.g * 0.20 + txt_color.g * 0.60;
	txt_color.b = leftColor.b * 0.30 + rightColor.b * 0.10 + txt_color.b * 0.60;

	fragColor = vec4(txt_color, 1.0);
}