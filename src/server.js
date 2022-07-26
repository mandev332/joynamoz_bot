import { config } from "dotenv";
config();
import fs from "fs";
import path from "path";
import TelegramBot from "node-telegram-bot-api";
import geoFinder from "../utils/geoFinder.js";
import func from "../utils/FS.js";
import keyboards from "../utils/keyboards.js";
const bot = new TelegramBot(process.env.API_KEY, {
  polling: true,
});

bot.on("error", console.error);

const admin = 1434141401;

let con = 0;
let chat = 0;
let Adress = "";
let contact = "";
let filePath = "";
let old_order = false;
let productlar = [];

bot.onText(/\/start/, (msg) => {
  if (msg.from.is_bot) return;
  productlar = [];
  bot.sendMessage(
    msg.from.id,
    "Assalomu alaykum! " + "\n" + msg.from.first_name + "\nMENU ni bosing!",
    {
      reply_markup: {
        keyboard: [keyboards.menu],
        resize_keyboard: true,
      },
    }
  );
});

async function toM(arg) {
  let xabar = func.toMessage(arg);
  bot.sendMessage(1434141401, xabar);
}

bot.on("message", (msg) => {
  chat += 1;
  const chat_id = msg.from.id;
  if (msg.text == "MENU 📋") {
    console.log(keyboards.royxat);

    if (msg.from.id == admin) {
      bot.sendMessage(chat_id, "Siz 👮‍♂️ (ADMIN)", {
        reply_markup: {
          keyboard: keyboards.admin,
          resize_keyboard: true,
        },
      });
    } else {
      bot.sendMessage(chat_id, "Sovg'alar 🎁", {
        reply_markup: {
          keyboard: keyboards.royxat,
          resize_keyboard: true,
        },
      });
    }
  } else if (
    msg.text == "Joynamoz" ||
    msg.text == "Quron" ||
    msg.text == "Nabor" ||
    msg.text == "Boshqa"
  ) {
    filePath = msg.text;
    let datas = func.read(msg.text);
    let orders = func.read("Order");
    let desc = ``;
    let button = [];
    let buttons = [];
    for (let data of datas) {
      let { id, name, title } = data;
      desc +=
        id + ":    <strong>" + name + "</strong>   <i>(" + title + ")</i> \n";
      button.push({ text: id + "", callback_data: id + "" });
      if (button.length == 5) {
        buttons.push(button);
        button = [];
      }
    }
    buttons.push(button);
    let findUser = orders.find((el) => el.user_id == msg.from.id);
    old_order = findUser ? true : false;
    if (findUser?.products.length) {
      buttons.push([
        {
          text: "Mening   🛍 larim",
          callback_data: "Order",
        },
      ]);
      con = 1;
    }
    if (productlar.length) {
      buttons.push([
        {
          text: "Yangi " + productlar.length + " ta   🛍ni qo'shish",
          callback_data: "NewOrder",
        },
      ]);
    }

    bot.sendPhoto(chat_id, "./images/" + filePath + "/main.jpg", {
      caption: desc,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  } else if (msg.text == "Ortga") {
    for (let i = 0; i <= chat; i++) {
      if (msg?.message_id - i) bot.deleteMessage(chat_id, msg.message_id - i);
    }
    chat = 0;
  }
});

bot.on("callback_query", async (msg) => {
  chat += 1;
  try {
    const chat_id = msg.message?.chat.id;
    if (msg.data[0] == "Z") {
      let datas = func.read(filePath);
      let product = datas.find((pro) => pro.id == msg.data.slice(2));
      if (product) productlar.push(product);
      bot.deleteMessage(chat_id, msg.message.message_id);
      bot.sendMessage(chat_id, "Yaxshi\nYana tanlang!");
      bot.sendMessage(
        chat_id,
        "Boshqa bo'limni tanlang!\nShunda tanlagan mahsulotlaringizni qo'shish uchun tugma paydo bo'ladi!"
      );
      con = 1;
    } else if (msg.data == "NewOrder" && con) {
      if (productlar.length) {
        let data = func.read("Order");
        let findUser = data.find((el) => el.user_id == msg.from.id) || [];
        if (old_order) {
          let obj = {
            user_id: msg.from.id,
            username: msg.from.first_name,
            nik_name: msg.from.username,
            contact: findUser.contact,
            adress: findUser.adress,
            products: findUser?.products?.length
              ? [...findUser.products, ...productlar]
              : [...productlar],
          };
          obj.products.map((el, i) =>
            el.product_id ? el : (el.product_id = i + 1)
          );
          let find = data.findIndex((user) => user.user_id == msg.from.id);
          if (find != -1) {
            data[find] = obj;
          } else {
            data.push(obj);
          }
          await fs.writeFileSync(
            path.join(process.cwd(), "database", "Order.json"),
            JSON.stringify(data, null, 4)
          );
          bot.deleteMessage(chat_id, msg.message.message_id);
          bot.sendMessage(chat_id, "✔️", {
            reply_markup: {
              keyboard: [[{ text: "MENU 📋" }]],
              resize_keyboard: true,
            },
          });
          toM(obj);
          con = 0;
        } else {
          bot.sendMessage(chat_id, "Kontaktingizni yuboring!", {
            reply_markup: {
              keyboard: keyboards.contact,
              resize_keyboard: true,
            },
          });
        }
      } else {
        bot.sendMessage(chat_id, "Avval mahsulot tanlang!");
      }
    } else if (msg.data == "loc_ok" && con) {
      if (!contact || !Adress) {
        bot.sendMessage(chat_id, "Kontakt va joylashuvni qayta kiriting!", {
          reply_markup: {
            keyboard: keyboards.contact,
            resize_keyboard: true,
          },
        });
      } else {
        let data = func.read("Order");
        let obj = {
          user_id: msg.from.id,
          username: msg.from.first_name,
          nik_name: msg.from.username,
          contact,
          adress: Adress,
          products: productlar,
        };
        obj.products.map((el, i) =>
          el.product_id ? el : (el.product_id = i + 1)
        );
        data.push(obj);
        await fs.writeFileSync(
          path.join(process.cwd(), "database", "Order.json"),
          JSON.stringify(data, null, 4)
        );
        toM(obj);
        bot.deleteMessage(chat_id, msg.message.message_id);
        bot.sendMessage(chat_id, "✔️", {
          reply_markup: {
            keyboard: [[{ text: "MENU 📋" }]],
            resize_keyboard: true,
          },
        });
      }
      con = 0;
    } else if (msg.data[0] == "X") {
      bot.deleteMessage(chat_id, msg.message.message_id);
    } else if (parseInt(msg.data)) {
      try {
        // if (message_id) bot.deleteMessage(chat_id, msg.message.message_id);
        let data = func.read(filePath);
        let find = data.find((e) => e.id == msg.data);
        let desc = `Nomi: ${find.name}\nNarxi: ${find.price} ming \nEski narxi: <del>${find.sold}</del> ming\nQo'shimcha ma'lumot: ${find.title}\n`;

        find.size && find.size instanceof Array
          ? (desc += `O'lchami: ${find.size[0]} x ${find.size[1]}`)
          : (desc += ` `);

        bot.sendPhoto(
          chat_id,
          "./images/" + filePath + "/" + msg.data + ".jpg",
          {
            caption: `${desc}`,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🛒",
                    callback_data: "Z_" + msg.data,
                  },
                  {
                    text: "❌",
                    callback_data: "X_" + msg.data,
                  },
                ],
              ],
            },
          }
        );
      } catch (err) {}
    } else if (msg.data == "Order") {
      let datas = func.read(msg.data);
      let desc = ``;
      let button = [];
      let buttons = [];
      let user = datas.find((u) => u.user_id == msg.from.id);
      if (user) {
        for (let data of user.products) {
          let { product_id, id, name, title } = data;
          desc +=
            product_id +
            ":    <strong>" +
            name +
            "</strong>   <i>(" +
            title +
            ")</i> \n";
          button.push({
            text: product_id + " ❌",
            callback_data: "x_," + product_id + "," + name + "," + title,
          });
          if (button.length == 5) {
            buttons.push(button);
            button = [];
          }
        }
        buttons.push(button);
      }
      bot.sendMessage(chat_id, desc, {
        caption: desc,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    } else if (msg.data[0] == "x" && con) {
      let id = msg.data.split(",")[1];
      let orders = func.read("Order");
      let product = orders
        .find((el) => el.user_id == msg.from.id)
        .products.filter((pro) => pro.product_id != id);

      let find = orders.findIndex((user) => user.user_id == msg.from.id);
      orders[find].products = product.map((el, i) => {
        el.product_id = i + 1;
        return el;
      });
      await fs.writeFileSync(
        path.join(process.cwd(), "database", "Order.json"),
        JSON.stringify(orders, null, 4)
      );
      toM(orders[find]);
      bot.deleteMessage(chat_id, msg.message.message_id);

      bot.sendMessage(chat_id, "✔️", {
        reply_markup: {
          keyboard: [keyboards.menu],
          resize_keyboard: true,
        },
      });
    } else if (msg.data == "Ortga") {
      for (let i = 0; i <= chat; i++) {
        if (msg?.message_id - i) bot.deleteMessage(chat_id, msg.message_id - i);
      }
      chat = 0;
      con = 0;
    }
  } catch (err) {
    console.log(err);
  }
});

bot.on("contact", (msg) => {
  chat += 1;
  const chat_id = msg.from.id;
  contact = "+" + msg.contact.phone_number;
  console.log(contact);
  bot.sendMessage(chat_id, "Joylashuvni jo'nating", {
    reply_markup: {
      keyboard: keyboards.location,
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

bot.on("location", async (msg) => {
  chat += 1;
  const chat_id = msg.from.id;
  const { latitude, longitude } = msg.location;
  let locatsiya = await geoFinder(latitude, longitude);
  console.log(locatsiya);
  Adress = locatsiya.results[0].formatted;
  bot.sendMessage(chat_id, "Manzilingiz: " + Adress + " ni tasdiqlang!", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅",
            callback_data: "loc_ok",
          },
          {
            text: "❌",
            callback_data: "X",
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
  con = 1;
});
