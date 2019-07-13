// https://www.shadertoy.com/view/MtlyDX

vec3 scanline(vec2 coord, vec3 screen){
    const float scale = .66;
    const float amt = 0.02;// intensity of effect
    const float spd = 1.0;//speed of scrolling rows transposed per second
    
	screen.rgb += sin((coord.y / scale - (time * spd * 6.28))) * amt;
	return screen;
}

// vec2 fisheye(vec2 uv, float str )
// {
//     vec2 neg1to1 = uv;
//     neg1to1 = (neg1to1 - 0.5) * 2.0;		
		
//     vec2 offset;
//     offset.x = ( pow(neg1to1.y,2.0)) * str * (neg1to1.x);
//     offset.y = ( pow(neg1to1.x,2.0)) * str * (neg1to1.y);
	
//     return uv + offset;	     
// }

// vec3 channelSplit(sampler2D tex, vec2 coord){
//     const float spread = 0.008;
// 	vec3 frag;
// 	frag.r = texture2D(tex, vec2(coord.x - spread * sin(time), coord.y)).r;
// 	frag.g = texture2D(tex, vec2(coord.x, 					  coord.y)).g;
// 	frag.b = texture2D(tex, vec2(coord.x + spread * sin(time), coord.y)).b;
// 	return frag;
// }

void mainImage(const in vec4 inputColor, const in vec2 fragCoord, out vec4 fragColor) {
	// vec2 uv = fragCoord.xy / resolution.xy;
	// vec2 fisheyeUV = fisheye(fragCoord, 0.03);
	// fragColor.rgb = channelSplit(inputBuffer, fisheyeUV);
	// vec2 screenSpace = fisheyeUV * resolution.xy;
	fragColor.rgb = scanline(fragCoord * resolution.xy, inputColor.rgb);
}

