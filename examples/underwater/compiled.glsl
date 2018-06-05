#define GLSLIFY 1
uniform sampler2D tDiffuse;
uniform sampler2D backgroundTexture;
uniform vec2 resolution;
uniform float aspect;
uniform float timeElapsed;
uniform float timeDelta;
varying vec2 vUv;

// https://www.shadertoy.com/view/4slGRM
const float PI = 3.1415926535897932;

// play with these parameters to custimize the effect
// ===================================================

//speed
const float speed = 0.1;
const float speed_x_1269279128 = 0.1;
const float speed_y_1269279128 = 0.3;

// refraction
const float emboss = 0.30;
const float intensity = 1.5;
const int steps = 8;
const float frequency = 6.0;
const int angle = 7; // better when a prime

// reflection
const float delta = 60.;
const float intence = 700.;

const float reflectionCutOff = 0.012;
const float reflectionIntence = 200000.;

// ===================================================
float col_0(vec2 coord,float time) {
	float delta_theta = 2.0 * PI / float(angle);
	float col = 0.0;
	float theta = 0.0;
	for (int i = 0; i < steps; i++)
	{
		vec2 adjc = coord;
		theta = delta_theta*float(i);
		adjc.x += cos(theta)*time*speed + time * speed_x_1269279128;
		adjc.y -= sin(theta)*time*speed - time * speed_y_1269279128;
		col = col + cos( (adjc.x*cos(theta) - adjc.y*sin(theta))*frequency)*intensity;
	}

	return cos(col);
}

//---------- main

vec2 ripple(vec2 inputUV) {
	float time = timeElapsed*1.3;

	vec2 p = inputUV.xy, c1 = p, c2 = p;
	float cc1 = col_0(c1,time);

	c2.x += resolution.x/delta;
	float dx = emboss*(cc1-col_0(c2,time))/delta;

	c2.x = p.x;
	c2.y += resolution.y/delta;
	float dy = emboss*(cc1-col_0(c2,time))/delta;

	c1.x += dx*2.;
	c1.y = (c1.y+dy*2.);

	float alpha = 1.+dot(dx,dy)*intence;

	float ddx = dx - reflectionCutOff;
	float ddy = dy - reflectionCutOff;
	if (ddx > 0. && ddy > 0.)
	alpha = pow(alpha, ddx*ddy*reflectionIntence);

	return c1;
}

void main() {
	vec2 ripplePos = ripple(vUv);
	ripplePos *= 0.9;

	vec4 fg = texture2D(tDiffuse, vUv);
	vec4 bg = texture2D(backgroundTexture, ripplePos);
	bg.a = 0.4;

	vec3 blended = bg.rgb * bg.a + fg.rgb * fg.a * (1.0 - bg.a);

	gl_FragColor = blended;
}
