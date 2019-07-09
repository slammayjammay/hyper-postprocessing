// adapted from https://github.com/Swordfish90/cool-retro-term/blob/master/app/qml/ShaderTerminal.qml

uniform highp vec4 fontColor;
uniform highp vec4 backgroundColor;

uniform sampler2D burnInSource;

uniform highp float staticNoise;
uniform lowp sampler2D noiseSource;

uniform highp float screenCurvature;

uniform lowp float chromaColor;

uniform lowp float ambientLight;

uniform lowp float horizontalSyncStrength;
uniform lowp float horizontalSyncFrequency;
uniform lowp float flickering;


// float rgb2grey(vec3 v) {
// 	return dot(v, vec3(0.21, 0.72, 0.04));
// }

// vec2 barrel(vec2 v, vec2 cc) {
// 	float distortion = dot(cc, cc) * screenCurvature;
// 	return (v - cc * (1.0 + distortion) * distortion);
// }

// vec3 convertWithChroma(vec3 inColor) {
// 	vec3 outColor = inColor;
// 	outColor = fontColor.rgb * mix(vec3(rgb2grey(inColor)), inColor, chromaColor);
// 	return outColor;
// }

vec4 texture(sampler2D buf, vec2 uv) {
	if(!(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0))
		return texture2D(buf, uv);
}

void mainImage(const in vec4 inputColor, const in vec2 fragCoord, out vec4 fragColor) {
	vec2 cc = vec2(0.5) - fragCoord;
	float distance = length(cc);

	vec2 initialCoords = vec2(fract(time/2.0), fract(time/PI));
	vec4 initialNoiseTexel = texture2D(noiseSource, initialCoords);
	float brightness = 1.0 + (initialNoiseTexel.g - 0.5) * flickering;
	float randval = initialNoiseTexel.r;
	float distortionScale = step(1.0 - horizontalSyncFrequency, randval) * randval * horizontalSyncStrength * 0.1;
	float distortionFreq = mix(4.0, 40.0, initialNoiseTexel.g);
	float noise = staticNoise;

	vec2 coords = fragCoord;

	float dst = sin((coords.y + time) * distortionFreq);
	coords.x += dst * distortionScale;

	noise += distortionScale * 7.0;

	vec4 noiseTexel = texture2D(noiseSource, resolution / (vec2(512, 512) * 0.75) * coords + vec2(fract(time * 1000.0 / 51.0), fract(time * 1000.0 / 237.0)));

	float color = 0.0001;

	float noiseVal = noiseTexel.a;
	color += noiseVal * noise * (1.0 - distance * 1.3);

	vec3 txt_color = texture(inputBuffer, coords).rgb;

	// vec2 staticCoords = barrel(fragCoord, cc);
	// vec4 txt_blur = texture2D(burnInSource, staticCoords);
	// vec3 burnInColor = 0.99 * (txt_blur.rgb - vec3(0.005));
	// txt_color = max(txt_color, convertWithChroma(burnInColor));

	txt_color += fontColor.rgb * vec3(color);

	vec3 finalColor = txt_color;
	finalColor *= brightness;
	finalColor += vec3(ambientLight) * (1.0 - distance) * (1.0 - distance);

	fragColor = vec4(finalColor, 1.0);
}



