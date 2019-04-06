const common = require("./webpack.common");
const waitOn = require("wait-on");
const open = require("open");

let isFirstEmit = true;

module.exports = {
    ...common,
    mode: "development",
    devtool: "inline-source-map",
    plugins: [
        {
            apply: (compiler) => {
                compiler.hooks.afterEmit.tap("open-browser", () => {
                    if (isFirstEmit) {
                        isFirstEmit = false;
                        waitOn({resources: ["http://localhost:5000"]}).then(() => {
                            open("http://localhost:5000")
                        });
                    }
                })
            }
        }
    ]
};