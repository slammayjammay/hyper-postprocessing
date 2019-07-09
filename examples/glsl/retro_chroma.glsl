// adapted from https://github.com/Swordfish90/cool-retro-term/blob/master/app/qml/ShaderTerminal.qml

uniform highp vec3 fontColor;
uniform highp vec3 backgroundColor;
uniform lowp float chromaColor;

float sum2(vec2 v) {
	return v.x + v.y;
}

float rgb2grey(vec3 v){
	return dot(v, vec3(0.21, 0.72, 0.04));
}

void mainImage(const in vec4 inputColor, const in vec2 fragCoord, out vec4 fragColor) {
	vec3 txt_color = inputColor.rgb;

	float greyscale_color = rgb2grey(txt_color);
	float reflectionMask = sum2(step(vec2(0.0), fragCoord) - step(vec2(1.0), fragCoord));
	reflectionMask = clamp(reflectionMask, 0.0, 1.0);

	vec3 foregroundColor = mix(fontColor, txt_color * fontColor / greyscale_color, chromaColor);
	vec3 finalColor = mix(backgroundColor, foregroundColor, greyscale_color * reflectionMask);

	fragColor = vec4(finalColor, 1.0);
}