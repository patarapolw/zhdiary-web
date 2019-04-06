const common = require("./webpack.common");
const OpenBrowserPlugin = require('open-browser-webpack-plugin');

module.exports = {
    ...common,
    mode: "development",
    devtool: "inline-source-map",
    plugins: [
        new OpenBrowserPlugin({
            url: 'http://localhost:5000'
        })
    ]
};