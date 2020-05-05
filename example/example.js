const parseObj = require("..");
const fs = require("fs");

const loader = path => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, "utf8", (err, data) => {
            if (err || !data) {
                reject(err || "No data");
            } else {
                resolve(data);
            }
        });
    });
};

if (process.argv.length <= 2) {
    console.error("Needs an .obj file name argument");
    process.exit(1);
}

var buf = fs.readFileSync(process.argv[2], "utf8");
parseObj(buf, loader).then(data => {
    console.log("data", data);
});
