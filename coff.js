const fs = require("fs");

function read_coff(filename)
{
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
            magic: file.readUint16LE(20),
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
            section.s_name = section.s_name.slice(0, section.s_name.length - 1);
        }
        section.s_name = section.s_name.toString();

        section.s_data = file.slice(s_scnptr, s_scnptr + s_size);

        // relocation entries
        section.s_relocs = [];
        for (var j = 0; j < s_nreloc; j++)
        {
            reloc = {
                r_vaddr: file.readInt32LE(s_relptr + j * 10),
                r_symndx: file.readInt32LE(s_relptr + j * 10 + 4),
                r_type: file.readUint16LE(s_relptr + j * 10 + 8)
            }
            section.s_relocs.push(reloc);
        }

        // line number entries
        section.s_lnnos = [];
        for (var j = 0; j < s_nlnno; j++)
        {
            var lnno = {
                l_symndx: file.readInt32LE(s_lnnoptr + j * 6),
                l_paddr: file.readInt32LE(s_lnnoptr + j * 6),
                l_lnno: file.readInt32LE(s_lnnoptr + j * 6 + 2)
            }
            section.s_lnnos.push(lnno);
        }

        sections.push(section);
        offset += 40;
    }

    // string table
    str_table_size = file.readUint32LE(f_symptr + f_nsyms * 18);
    str_table = file.slice(
        f_symptr + f_nsyms * 18,
        f_symptr + f_nsyms * 18 + str_table_size
    );

    // symbol table
    sym_table = [];
    for (var i = 0; i < f_nsyms; i++)
    {
        symbol = {
            n_value: file.readInt32LE(f_symptr + i * 18 + 8),
            n_scnum: file.readInt16LE(f_symptr + i * 18 + 12),
            n_type: file.readUint16LE(f_symptr + i * 18 + 14),
            n_sclass: file.slice(f_symptr + i * 18 + 16, f_symptr + i * 18 + 17).toString(),
            n_numaux: file.slice(f_symptr + i * 18 + 17, f_symptr + i * 18 + 18).toString(),
        }

        n_zeroes = file.readUint32LE(f_symptr + i * 18);
        if (n_zeroes === 0)
        {
            // read name from string table
            offset = file.readUint32LE(f_symptr + i * 18 + 4);
            for (var j = offset; j < str_table_size; j++)
            {
                if (str_table[j] === 0)
                {
                    symbol.n_name = str_table.slice(offset, j).toString();
                    break;
                }
            }
        } else {
            symbol.n_name = file.slice(f_symptr + i * 18, f_symptr + i * 18 + 8);

            // remove trailing null bytes
            while (symbol.n_name[symbol.n_name.length - 1] === 0)
            {
                symbol.n_name = symbol.n_name.slice(0, symbol.n_name.length - 1);
            }
            symbol.n_name = symbol.n_name.toString();
        }


        sym_table.push(symbol)
    }
}
