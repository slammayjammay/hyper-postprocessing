// samples from the "backgroundImage" uniform. also allows motion on the image
// -- positive x and y values slide the image right and up

#ifndef motionX
#define motionX 0.0
#endif

#ifndef motionY
#define motionY 0.0
#endif

uniform sampler2D backgroundImage;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	vec2 pos = vec2(
		mod(uv.x - motionX * time, 1.0),
		mod(uv.y - motionY * time, 1.0)
	);

	outputColor = texture2D(backgroundImage, pos);
}
