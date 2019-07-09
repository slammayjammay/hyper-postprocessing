// https://www.shadertoy.com/view/ltGGRh
//PORTED FROM https://the8bitpimp.wordpress.com/2014/07/17/retro-crt-shader/ AS A TEST

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // per row offset
    float f  = sin( uv.y * 320.0 * 3.14 );
    // scale to per pixel
    float o  = f * (0.35 / 320.0);
    // scale for subtle effect
    float s  = f * .03 + 0.97;
    // scan line fading
    float l  = sin( time * 32. )*.08 + 0.92;
    // sample in 3 colour offset
    float r = texture2D( inputBuffer, vec2( uv.x+o, uv.y+o ) ).x;
    float g = texture2D( inputBuffer, vec2( uv.x-o, uv.y+o ) ).y;
    float b = texture2D( inputBuffer, vec2( uv.x  , uv.y-o ) ).z;
    // combine as 
    outputColor = vec4( r*0.7, g, b*0.9, l)*l*s;
}