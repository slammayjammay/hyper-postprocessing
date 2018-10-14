// https://www.shadertoy.com/view/XlfGRj

// This content is under the MIT License.
// Star Nest by Pablo Roman Andrioli

#define iterations 15
#define formuparam 0.79

#define volsteps 8
#define stepsize 0.2

#define zoom   0.800
#define tile   0.850
#define speed  0.005

#define brightness 0.0015
#define darkmatter 0.0
#define distfading 0.730
#define saturation 0.850

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
	//get coords and direction
	vec2 pos=uv-.5;
	pos.y*=resolution.y/resolution.x;
	vec3 dir=vec3(pos*zoom,1.);
	float timeElapsed=time*speed+.25;

	float a2 = 0.02 * time;
	mat2 rot2=mat2(cos(a2),sin(a2),-sin(a2),cos(a2));
	dir.xy*=rot2;
	vec3 from=vec3(1.,.5,0.5);
	from+=vec3(timeElapsed*2.,timeElapsed,-2.);

	//volumetric rendering
	float s=0.1,fade=1.;
	vec3 v=vec3(0.);
	for (int r=0; r<volsteps; r++) {
		vec3 p=from+s*dir*.5;
		p = abs(vec3(tile)-mod(p,vec3(tile*2.))); // tiling fold
		float pa,a=pa=0.;
		for (int i=0; i<iterations; i++) {
			p=abs(p)/dot(p,p)-formuparam; // the magic formula
			a+=abs(length(p)-pa); // absolute sum of average change
			pa=length(p);
		}
		float dm=max(0.,darkmatter-a*a*.001); //dark matter
		a*=a*a; // add contrast
		if (r>6) fade*=1.-dm; // dark matter, don't render near
		v+=fade;
		v+=vec3(s,s*s,s*s*s*s)*a*brightness*fade; // coloring based on distance
		fade*=distfading; // distance fading
		s+=stepsize;
	}
	v=mix(vec3(length(v)),v,saturation); //color adjust
	outputColor = vec4(v*.01,1.);

}
