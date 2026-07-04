type Sheet = {
  name: string;
  rows: Array<Array<string | number | null | undefined>>;
};

const encoder = new TextEncoder();

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const columnName = (index: number) => {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const mod = (value - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    value = Math.floor((value - mod) / 26);
  }
  return name;
};

const sheetXml = (sheet: Sheet) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheet.rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">
      ${row.map((cell, colIndex) => {
        const ref = `${columnName(colIndex)}${rowIndex + 1}`;
        if (typeof cell === "number") {
          return `<c r="${ref}"><v>${cell}</v></c>`;
        }
        return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(cell ?? ""))}</t></is></c>`;
      }).join("")}
    </row>`).join("")}
  </sheetData>
</worksheet>`;

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

const crc32 = (data: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const push16 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff);
};

const push32 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
};

export const createXlsxBlob = (sheets: Sheet[]) => {
  const files: Array<{ name: string; data: Uint8Array }> = [
    {
      name: "[Content_Types].xml",
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`),
    },
    {
      name: "_rels/.rels",
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    },
    {
      name: "xl/workbook.xml",
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((sheet, index) => `<sheet name="${escapeXml(sheet.name.slice(0, 31))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}
  </sheets>
</workbook>`),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("")}
</Relationships>`),
    },
    ...sheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, data: encoder.encode(sheetXml(sheet)) })),
  ];

  const output: number[] = [];
  const central: number[] = [];

  files.forEach((file) => {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const offset = output.length;
    push32(output, 0x04034b50);
    push16(output, 20);
    push16(output, 0);
    push16(output, 0);
    push16(output, 0);
    push16(output, 0);
    push32(output, crc);
    push32(output, file.data.length);
    push32(output, file.data.length);
    push16(output, name.length);
    push16(output, 0);
    output.push(...name, ...file.data);

    push32(central, 0x02014b50);
    push16(central, 20);
    push16(central, 20);
    push16(central, 0);
    push16(central, 0);
    push16(central, 0);
    push16(central, 0);
    push32(central, crc);
    push32(central, file.data.length);
    push32(central, file.data.length);
    push16(central, name.length);
    push16(central, 0);
    push16(central, 0);
    push16(central, 0);
    push16(central, 0);
    push32(central, 0);
    push32(central, offset);
    central.push(...name);
  });

  const centralOffset = output.length;
  output.push(...central);
  push32(output, 0x06054b50);
  push16(output, 0);
  push16(output, 0);
  push16(output, files.length);
  push16(output, files.length);
  push32(output, central.length);
  push32(output, centralOffset);
  push16(output, 0);

  return new Blob([new Uint8Array(output)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};
