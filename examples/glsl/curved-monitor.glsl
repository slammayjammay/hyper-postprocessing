// pythagorean theorem
float distanceFromOrigin(vec2 point, vec2 origin) {
	float deltaX = (point.x - origin.x);
	float deltaY = (point.y - origin.y);
	return sqrt(pow(deltaX, 2.0) + pow(deltaY, 2.0));
}

float easeInQuart(float time, float begin, float change, float duration) {
	return change * (time /= duration) * time * time * time + begin;
}

void mainUv(inout vec2 uv) {
	vec2 screenCenter = vec2(0.5, 0.5);
	float radius = 0.5;
	float magnitude = 0.15; // how far the center of the "monitor" points out
	float cutShort = 0.3; // how far along the the easing curve we travel...I think...

	vec2 coords = vec2(uv.x - screenCenter.x, uv.y - screenCenter.y);

	float distFromOrigin = distanceFromOrigin(uv, screenCenter);

	float scalar = easeInQuart(distFromOrigin, 1.0 / cutShort - magnitude, magnitude, radius);
	coords *= scalar * cutShort;

	uv = vec2(coords.x + screenCenter.x, coords.y + screenCenter.y);
}
