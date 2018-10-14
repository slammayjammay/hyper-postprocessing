// https://www.shadertoy.com/view/4slGRM

// play with these parameters to custimize the effect
// ===================================================
uniform sampler2D backgroundImage;

//speed
const float speed = 0.1;
const float speed_x = 0.1;
const float speed_y = 0.3;

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

float col(vec2 coord,float time) {
	float delta_theta = 2.0 * PI / float(angle);
	float col = 0.0;
	float theta = 0.0;
	for (int i = 0; i < steps; i++)
	{
		vec2 adjc = coord;
		theta = delta_theta*float(i);
		adjc.x += cos(theta)*time*speed + time * speed_x;
		adjc.y -= sin(theta)*time*speed - time * speed_y;
		col = col + cos( (adjc.x*cos(theta) - adjc.y*sin(theta))*frequency)*intensity;
	}

	return cos(col);
}

void mainUv(inout vec2 uv) {
	vec2 p = uv.xy, c1 = p, c2 = p;
	float cc1 = col(c1,time);

	c2.x += resolution.x/delta;
	float dx = emboss*(cc1-col(c2,time))/delta;

	c2.x = p.x;
	c2.y += resolution.y/delta;
	float dy = emboss*(cc1-col(c2,time))/delta;

	c1.x += dx*2.;
	c1.y = (c1.y+dy*2.);

	float alpha = 1.+dot(dx,dy)*intence;

	float ddx = dx - reflectionCutOff;
	float ddy = dy - reflectionCutOff;
	if (ddx > 0. && ddy > 0.)
		alpha = pow(alpha, ddx*ddy*reflectionIntence);

	uv = c1;
}
