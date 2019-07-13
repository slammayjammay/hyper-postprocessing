// adapted from https://github.com/Swordfish90/cool-retro-term/blob/master/app/qml/ShaderTerminal.qml

uniform lowp float screenCurvature;
uniform lowp vec3 frameColor;

vec2 distortCoordinates(vec2 coords){
	vec2 cc = (coords - vec2(0.5));
	float dist = dot(cc, cc) * screenCurvature;
	return (coords + cc * (1.0 + dist) * dist);
}

float max2(vec2 v) {
	return max(v.x, v.y);
}

vec4 texture(sampler2D buf, vec2 uv) {
	if(!(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0))
		return texture2D(buf, uv);
}

float roundSquare(vec2 p, vec2 b, float r) {
	return length(max(abs(p)-b,0.0))-r;
}

// Calculate normal to distance function and move along
// normal with distance to get point of reflection
vec2 borderReflect(vec2 p)
{
	float r = 0.01;
	float eps = 0.0001;
	vec2 epsx = vec2(eps,0.0);
	vec2 epsy = vec2(0.0,eps);
	vec2 b = (0.999+vec2(r,r))* 0.5;
	r /= 3.0;
	
	p -= 0.5;

	vec2 normal = vec2(roundSquare(p-epsx,b,r)-roundSquare(p+epsx,b,r),
					   roundSquare(p-epsy,b,r)-roundSquare(p+epsy,b,r))/eps;

	if (max2(abs(p) - b) < 0.0 || abs(normal.x * normal.y) > 0.0)
		return vec2(-1.0);

	float d = roundSquare(p, b, r);
	p += 0.5;

	return p + d*normal;
}

void mainImage(const in vec4 inputColor, const in vec2 fragCoord, out vec4 fragColor) {
	vec2 coords = distortCoordinates(fragCoord);
	vec3 color = texture(inputBuffer, coords).rgb;
	float alpha = 0.0;
	float outShadowLength = 0.5 * screenCurvature;
	float outShadow = max2(1.0 - smoothstep(vec2(-outShadowLength), vec2(-0.01), coords) + smoothstep(vec2(1.01), vec2(1.0 + outShadowLength), coords));
	outShadow = clamp(sqrt(outShadow), 0.0, 1.0);
	color += frameColor * outShadow;

	vec2 reflected = borderReflect(coords);
	color += max(texture(inputBuffer, reflected).rgb * 0.6 - 0.1, 0.0);
	fragColor = vec4(color, 1.0);
}