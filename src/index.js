// port of https://github.com/syoyo/tinyobjloader-c/ to JS

const MaxFacesPerFLine = 16;

class ObjCommand
{
    constructor(cmdtype) {
        this._type = cmdtype;
        this._floats = undefined;
        this._faces = undefined;
        this._numVerts = undefined;
        this._numF = this._numFNumVerts = undefined;

        this._name = undefined;
        this._materialName = undefined;
        this._mtllibName = undefined;
    }

    get type() {
        return this._type;
    }

    addFloat(f1, f2, f3) {
        if (f3 !== undefined)
            this._floats = [f1, f2, f3];
        else
            this._floats = [f1, f2];
    }

    get floats() {
        return this._floats;
    }

    addFace(numF, numFNumVerts, nfs, fs) {
        this._numF = numF;
        this._numFNumVerts = numFNumVerts;
        this._numVerts = nfs;
        this._faces = fs;
    }

    get faces() {
        return this._faces;
    }

    get numVerts() {
        return this._numVerts;
    }

    get numF() {
        return this._numF;
    }

    get numFNumVerts() {
        return this._numFNumVerts;
    }

    set name(g) {
        this._name = g;
    }

    get name() {
        return this._name;
    }
}

ObjCommand.CmdV      = 0;
ObjCommand.CmdVN     = 1;
ObjCommand.CmdVT     = 2;
ObjCommand.CmdF      = 3;
ObjCommand.CmdG      = 4;
ObjCommand.CmdO      = 5;
ObjCommand.CmdUseMtl = 6;
ObjCommand.CmdMtlLib = 7;

class Material
{
    constructor(id) {
        this._id = id;
        this._Ka = undefined; // ambient
        this._Kd = undefined; // diffuse
        this._Ks = undefined; // specular
        this._Kt = undefined; // transmittance
        this._Ni = undefined; // index of refraction
        this._Ke = undefined; // emission
        this._Ns = undefined; // shininess
        this._illum = undefined; // illum model
        this._d = undefined; // dissolve
        this._Tr = undefined; //
        this._map_Ka = undefined; // ambient texture
        this._map_Kd = undefined; // diffuse texture
        this._map_Ks = undefined; // specular texture
        this._map_Ns = undefined; // specular highlight texture
        this._map_bump = undefined; // bump texture
        this._map_d = undefined; // alpha texture
        this._disp = undefined; // displacement texture
    }

    get id() {
        return this._id;
    }

    get ka() {
        return this._Ka;
    }

    set ka(v) {
        this._Ka = v;
    }

    get kd() {
        return this._Kd;
    }

    set kd(v) {
        this._Kd = v;
    }

    get ks() {
        return this._Ks;
    }

    set ks(v) {
        this._Ks = v;
    }

    get kt() {
        return this._Kt;
    }

    set kt(v) {
        this._Kt = v;
    }

    get ni() {
        return this._Ni;
    }

    set ni(v) {
        this._Ni = v;
    }

    get ke() {
        return this._Ke;
    }

    set ke(v) {
        this._Ke = v;
    }

    get ns() {
        return this._Ns;
    }

    set ns(v) {
        this._Ns = v;
    }

    get illum() {
        return this._illum;
    }

    set illum(v) {
        this._illum = v;
    }

    get d() {
        return this._d;
    }

    set d(v) {
        this._d = v;
    }

    get tr() {
        return this._Tr;
    }

    set tr(v) {
        this._Tr = v;
    }

    get map_Ka() {
        return this._map_Ka;
    }

    set map_Ka(v) {
        this._map_Ka = v;
    }

    get map_Kd() {
        return this._map_Kd;
    }

    set map_Kd(v) {
        this._map_Kd = v;
    }

    get map_Ks() {
        return this._map_Ks;
    }

    set map_Ks(v) {
        this._map_Ks = v;
    }

    get map_Ns() {
        return this._map_Ns;
    }

    set map_Ns(v) {
        this._map_Ns = v;
    }

    get map_bump() {
        return this._map_bump;
    }

    set map_bump(v) {
        this._map_bump = v;
    }

    get map_d() {
        return this._map_d;
    }

    set map_d(v) {
        this._map_d = v;
    }

    get disp() {
        return this._disp;
    }

    set disp(v) {
        this._disp = v;
    }
}

class Shape
{
    constructor(name, offset, length)
    {
        this._name = name;
        this._offset = offset;
        this._length = length;
    }

    get name() {
        return this._name;
    }

    get faceOffset() {
        return this._offset;
    }

    get length() {
        return this._length;
    }
};

function parseFloat3(type, cmds, tokens)
{
    const v1 = parseFloat(tokens[1]);
    const v2 = parseFloat(tokens[2]);
    const v3 = parseFloat(tokens[3]);
    const cmd = new ObjCommand(type);
    cmd.addFloat(v1, v2, v3);
    cmds.push(cmd);
}

function parseFloat2(type, cmds, tokens)
{
    const v1 = parseFloat(tokens[1]);
    const v2 = parseFloat(tokens[2]);
    const cmd = new ObjCommand(type);
    cmd.addFloat(v1, v2);
    cmds.push(cmd);
}

function parseTriple(str)
{
    // this can parse i, i/j/k/ i//k, i/j
    const tokens = str.split("/");
    const ret = [-1, -1, -1]; // v, vt, vn
    if (!tokens.length)
        return ret;
    ret[0] = parseInt(tokens[0]);
    if (tokens.length > 1 && tokens[1].length > 0)
        ret[1] = parseInt(tokens[1]);
    if (tokens.length > 2 && tokens[2].length > 0)
        ret[2] = parseInt(tokens[2]);
    return ret;
}

function parseFace(cmds, tokens, triangulate)
{
    var fs = [], nfs = [];
    let numF = tokens.let;
    let numFNumVerts = 0;
    for (let i = 1; i < tokens.length; ++i) {
        fs.push(parseTriple(tokens[i]));
    }
    if (triangulate) {
        const tfs = [];
        let i0 = fs[0], i1, i2 = fs[1];
        for (var i = 2; i < fs.length; ++i) {
            i1 = i2;
            i2 = fs[i];
            tfs.push(i0);
            tfs.push(i1);
            tfs.push(i2);
            nfs.push(3);
            ++numFNumVerts;
        }
        numF = numFNumVerts * 3;
        fs = tfs;
    } else {
        numFNumVerts = 1;
        nfs.push(numF);
    }
    const cmd = new ObjCommand(ObjCommand.CmdF);
    cmd.addFace(numF, numFNumVerts, nfs, fs);
    cmds.push(cmd);
}

function applyName(type, cmds, tokens)
{
    const cmd = new ObjCommand(type);
    cmd.name = tokens.slice(1).join(" ");
    cmds.push(cmd);
}

function fixIndex(idx, n)
{
    if (idx > 0) return idx - 1;
    if (idx == 0) return 0;
    return n + idx; /* negative value = relative */
}

function parseObj(objstr, loader) {
    return new Promise((resolve, reject) => {
        const cmds = [];

        let numV = 0, numVN = 0, numVT = 0, numF = 0, numFaces = 0;
        let mtlpath = undefined;

        const data = objstr.split("\n");
        for (const line of data) {
            const trimmed = line.trim();
            if (trimmed.length === 0 || trimmed[0] === '#') {
                // empty string or comment, skip
                continue;
            }
            const tokens = trimmed.split(/[ \t]/).filter(e => e.length > 0);
            switch (tokens[0]) {
            case "v":
                parseFloat3(ObjCommand.CmdV, cmds, tokens);
                ++numV;
                break;
            case "vn":
                parseFloat3(ObjCommand.CmdVN, cmds, tokens);
                ++numVN;
                break;
            case "vt":
                parseFloat2(ObjCommand.CmdVT, cmds, tokens);
                ++numVT;
                break;
            case "f":
                parseFace(cmds, tokens);
                numF += cmds[cmds.length - 1].numF;
                numFaces += cmds[cmds.length - 1].numFNumVerts;
                break;
            case "g":
                applyName(ObjCommand.CmdG, cmds, tokens);
                break;
            case "o":
                applyName(ObjCommand.CmdO, cmds, tokens);
                break;
            case "usemtl":
                applyName(ObjCommand.CmdUseMtl, cmds, tokens);
                break;
            case "mtllib":
                mtlpath = tokens.slice(1).join(" ");
                break;
            }
        }

        let matmap = new Map();
        let matarray = [];
        let nextMatId = 0;

        const parseMtl = mtlstr => {
            let mat = undefined;
            let matname = undefined;

            const mtldata = mtlstr.split("\n");
            for (const line of mtldata) {
                const trimmed = line.trim();
                if (trimmed.length === 0 || trimmed[0] === '#') {
                    // empty string or comment, skip
                    continue;
                }
                const tokens = trimmed.split(/[ \t]/).filter(e => e.length > 0);
                switch (tokens[0]) {
                case "newmtl":
                    if (mat !== undefined) {
                        matmap.set(matname, mat);
                        matarray.push(mat);
                    }
                    mat = new Material(nextMatId++);
                    matname = tokens.slice(1).join(" ");
                    break;
                case "Ka":
                    mat.ka = [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])];
                    break;
                case "Kd":
                    mat.kd = [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])];
                    break;
                case "Ks":
                    mat.ks = [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])];
                    break;
                case "Kt":
                    mat.kt = [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])];
                    break;
                case "Ke":
                    mat.ke = [parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])];
                    break;
                case "Ni":
                    mat.ni = parseFloat(tokens[1]);
                    break;
                case "Ns":
                    mat.ns = parseFloat(tokens[1]);
                    break;
                case "illum":
                    mat.illum = parseInt(tokens[1]);
                    break;
                case "d":
                    mat.d = parseFloat(tokens[1]);
                    break;
                case "Tr":
                    mat.d = 1.0 - parseFloat(tokens[1]);
                    break;
                case "map_Ka":
                    mat.map_Ka = tokens.slice(1).join(" ");
                    break;
                case "map_Kd":
                    mat.map_Kd = tokens.slice(1).join(" ");
                    break;
                case "map_Ks":
                    mat.map_Ks = tokens.slice(1).join(" ");
                    break;
                case "map_Ns":
                    mat.map_Ns = tokens.slice(1).join(" ");
                    break;
                case "map_bump":
                case "bump":
                    mat.map_bump = tokens.slice(1).join(" ");
                    break;
                case "map_d":
                    mat.map_d = tokens.slice(1).join(" ");
                    break;
                case "disp":
                    mat.disp = tokens.slice(1).join(" ");
                    break;
                }
            }

            if (mat !== undefined) {
                matmap.set(matname, mat);
                matarray.push(mat);
            }
        };

        const resume = (mtlstr) => {
            if (mtlstr) {
                parseMtl(mtlstr);
            }

            const verts = [];
            const normals = [];
            const texcoords = [];
            const faces = [];
            const materialIds = [];
            const faceNumVerts = [];
            let vcnt = 0, ncnt = 0, tcnt = 0;
            let shapecnt = 0;

            let materialId = 0;
            for (const cmd of cmds) {
                switch (cmd.type) {
                case ObjCommand.CmdUseMtl:
                    const mat = matmap.get(cmd.name);
                    if (mat) {
                        materialId = mat.id;
                    }
                    break;
                case ObjCommand.CmdV:
                    verts.push(cmd.floats[0]);
                    verts.push(cmd.floats[1]);
                    verts.push(cmd.floats[2]);
                    ++vcnt;
                    break;
                case ObjCommand.CmdVN:
                    normals.push(cmd.floats[0]);
                    normals.push(cmd.floats[1]);
                    normals.push(cmd.floats[2]);
                    ++ncnt;
                    break;
                case ObjCommand.CmdVT:
                    texcoords.push(cmd.floats[0]);
                    texcoords.push(cmd.floats[1]);
                    ++tcnt;
                    break;
                case ObjCommand.CmdF:
                    for (const face of cmd.faces) {
                        const vIdx = fixIndex(face[0], vcnt);
                        const vtIdx = fixIndex(face[1], tcnt);
                        const vnIdx = fixIndex(face[2], ncnt);
                        faces.push([vIdx, vtIdx, vnIdx]);
                    }
                    const numVerts = cmd.numVerts;
                    for (var i = 0; i < cmd.numFNumVerts; ++i) {
                        materialIds.push(materialId);
                        faceNumVerts.push(numVerts[i]);
                    }
                    break;
                case ObjCommand.CmdO:
                case ObjCommand.CmdG:
                    ++shapecnt;
                    break;
                }
            }

            // calculate number of shapes
            //console.log("shapes", shapecnt);
            let shapes = [];
            let prevName = undefined;
            let prevShapeFaceOffset = 0;
            let prevFaceOffset = 0;
            let faceCount = 0;

            for (const cmd of cmds) {
                switch (cmd.type) {
                case ObjCommand.CmdF:
                    ++faceCount;
                    break;
                case ObjCommand.CmdO:
                case ObjCommand.CmdG:
                    if (faceCount === 0) {
                        // 'o' or 'g' before any 'f'
                        prevName = cmd.name;
                        prevFaceOffset = faceCount;
                        prevShapeFaceOffset = faceCount;
                    } else {
                        if (shapes.length === 0) {
                            // first shape
                            shapes.push(new Shape(prevName, prevFaceOffset, faceCount - prevFaceOffset));
                            prevFaceOffset = faceCount;
                        } else {
                            if (faceCount - prevFaceOffset > 0) {
                                shapes.push(new Shape(prevName, prevFaceOffset, faceCount - prevFaceOffset));
                                prevFaceOffset = faceCount;
                            }
                        }
                        prevName = cmd.name;
                        prevShapeFaceOffset = faceCount;
                    }
                    break;
                }
            }

            if (faceCount - prevFaceOffset > 0) {
                shapes.push(new Shape(prevName, prevFaceOffset, faceCount - prevFaceOffset));
            }

            resolve({
                attrib: {
                    vertices: verts,
                    normals: normals,
                    texcoords: texcoords,
                    faces: faces,
                    numFaces: numF,
                    numFaceNumVerts: numFaces,
                    materialId: materialIds
                },
                shapes: shapes
            });
        };

        if (mtlpath !== undefined) {
            if (!loader) {
                throw new Error(`Can't load mtllib ${mtlpath} without a loader`);
            }
            loader(mtlpath).then(mtldata => {
                resume(mtldata);
            });
        } else {
            resume();
        }
    });
}

const fs = require("fs");

const loader = path => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, "utf8", (err, data) => {
            resolve(data);
        });
    });
};

var buf = fs.readFileSync("./teapot.obj", "utf8");
parseObj(buf, loader).then(data => {
    console.log("data", data);
});
