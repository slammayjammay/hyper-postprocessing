module.exports = {
	entry: `${__dirname}/index.js`,
	output: {
		path: `${__dirname}/dist`,
		filename: 'built.js',
		libraryTarget: 'commonjs'
	},
	target: 'node'
};
