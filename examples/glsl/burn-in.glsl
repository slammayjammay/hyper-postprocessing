
uniform lowp sampler2D burnInSource;
uniform lowp float burnInTime;

void mainImage(const in vec4 inputColor, const in vec2 coords, out vec4 fragColor) {
    vec4 accColor = texture2D(burnInSource, coords) * (0.7 + 0.3 * burnInTime) - vec4(0.005);
    fragColor = max(accColor, inputColor);
}
