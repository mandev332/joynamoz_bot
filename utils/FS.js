import fs from "fs";
import path from "path";

export default {
  read: function (filepath) {
    let datas = fs.readFileSync(
      path.join(process.cwd(), "database", (filepath || "Joynamoz") + ".json"),
      "utf-8"
    );

    return JSON.parse(datas);
  },
  write: function (filepath, data) {
    fs.writeFileSync(
      path.join(process.cwd(), "database", filepath + ".json"),
      JSON.stringify(data, null, 4)
    );
  },

  toMessage: function (user) {
    let xabar = `Zakas  📌\nID:${user.user_id}\n${user.username}: (@${user.nik_name}),\nKontact: ${user.contact},\nAdress: ${user.adress},\nSana: ${user.date},\nMahsulot: \n`;
    for (let i of user.products) {
      xabar +=
        i.product_id +
        ": " +
        i.name +
        "\n   Bo'lim: " +
        i.category +
        "\n   Narxi: " +
        i.price +
        "\n   O'lchami: " +
        (i.size[0] ? i.size[0] : 1) +
        "x" +
        (i.size[1] ? i.size[1] : 1) +
        "\n   Qo'sh. ma'l: " +
        i.title +
        "\n";
    }
    return xabar;
  },
};
