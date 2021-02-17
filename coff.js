const fs = require("fs");

function read_coff(filename) {
    file = fs.readFileSync(filename, null);

    // COFF file header
    var header = {
        f_magic: file.readUint16LE(0),
        f_timdat: file.readInt32LE(4),
        f_flags: file.readUint16LE(18)
    }

    var f_nscns = file.readUint16LE(2);
    var f_symptr = file.readInt32LE(8);
    var f_nsyms = file.readInt32LE(12);
    var f_opthdr = file.readUint16LE(16);

    var offset = 20;
    var optional_header = undefined;
    if (f_opthdr !== 0)
    {
        // optional header
        optional_header = {
            magic: file.readUint15LE(20),
            vstamp: file.readUint16LE(22),
            tsize: file.readUint32LE(24),
            dsize: file.readUint32LE(28),
            bsize: file.readUint32LE(32),
            entry: file.readUint32LE(36),
            text_start: file.readUint32LE(40),
            data_start: file.readUintLE(44),
        }
        offset += 8;
    }

    var sections = [];
    for (var i = 0; i < f_nscns; i++)
    {
        // section headers
        var section = {
            s_name: file.slice(offset, offset+8),
            s_paddr: file.readInt32LE(offset+8),
            s_vaddr: file.readInt32LE(offset+12),
            s_flags: file.readInt32LE(offset+36)
        }

        var s_size = file.readInt32LE(offset+16);
        var s_scnptr = file.readInt32LE(offset+20);
        var s_relptr = file.readInt32LE(offset+24);
        var s_lnnoptr = file.readInt32LE(offset+28);
        var s_nreloc = file.readUint16LE(offset+32);
        var s_nlnno = file.readUint16LE(offset+34);

        // remove trailing null bytes from name
        while (section.s_name[section.s_name.length - 1] === 0)
        {
            section.s_name = section.s_name.slice(0, section.s_name.length - 2);
        }
        section.s_name = section.s_name.toString();

        section.s_data = file.slice(s_scnptr, s_scnptr + s_size);

        sections.push(section);
        offset += 40;
    }
}
