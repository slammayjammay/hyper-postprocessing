module.exports = {
	mode: 'production',
	entry: `${__dirname}/index.js`,
	output: {
		path: `${__dirname}/dist`,
		filename: 'built.js',
		libraryTarget: 'commonjs'
	},
	target: 'node'
};
