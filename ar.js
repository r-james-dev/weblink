const fs = require("fs");

function read_ar(filename)
{
    archive = fs.readFileSync(filename, null);

    if (archive.slice(0, 8).toString() !== "!<arch>\n")
    {
        throw "Incorrect magic number";
    }

    var offset = 8;
    files = [];
    while (offset < archive.length)
    {
        // file metadata
        file = {
            id: archive.slice(offset, offset + 16).toString().trimRight(),
            mod_time: parseInt(archive.slice(offset + 16, offset + 28).toString(), 10),
            owner: parseInt(archive.slice(offset + 28, offset + 34).toString(), 10),
            group: parseInt(archive.slice(offset + 34, offset + 40).toString(), 10),
            mode: parseInt(archive.slice(offset + 40, offset + 48).toString(), 10)
        }

        // remove System V style "/" endings from filenames
        if (file.id[file.id.length-1] === "/")
        {
            file.id = file.id.slice(0, file.id.length - 1);
        }

        size = parseInt(archive.slice(offset + 48, offset + 58).toString(), 10)

        file.data = archive.slice(offset + 60, offset + 60 + size);

        var ending = archive.readUint16BE(offset + 58);
        if (ending !== 0x600A)
        {
            throw "Incorrect header ending"
        }

        offset += 60 + size;

        // account for padding bytes
        if (offset % 2 === 1)
        {
            offset += 1;
        }

        // drop symbol tables
        if (!(file.id === "" || file.id === "/"))
        {
            files.push(file);
        }
    }

    return files;
}
