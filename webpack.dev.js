const common = require("./webpack.common");
const waitOn = require("wait-on");
const open = require("open");

module.exports = {
    ...common,
    mode: "development",
    devtool: "inline-source-map",
    plugins: [
        {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tap("open-browser", () => {
                    waitOn({resources: ["http://localhost:5000"]}).then(() => {
                        open("http://localhost:5000")
                    })
                })
            }
        }
    ]
};