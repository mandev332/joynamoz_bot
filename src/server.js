import { config } from "dotenv";
config();
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
let image = false;
let filePath = "";
let deleteUser = false;
let old_order = false;
let productlar = [];

bot.onText(/\/start/, async (msg) => {
  if (msg.from.is_bot) return;
  await bot.sendSticker(
    msg.from.id,
    "https://tlgrm.eu/_/stickers/380/9fb/3809fbe6-317b-3085-99e6-09e74c1044b0/11.webp"
  );
  await bot.sendMessage(
    msg.from.id,
    "Assalomu alaykum! " +
      "\n" +
      msg.from.first_name +
      "\nRO'YXAT 📋ni bosing!",
    {
      reply_markup: {
        keyboard: [keyboards.menu],
        resize_keyboard: true,
      },
    }
  );
});

async function toMessageAdmin(arg) {
  let xabar = func.toMessage(arg);
  bot.sendMessage(admin, xabar);
}

bot.on("message", async (msg) => {
  try {
    chat += 1;
    const chat_id = msg.from.id;
    if (msg.text == "RO'YXAT 📋") {
      productlar = [];
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
    } else if (msg.text == "Ko'rish") {
      let data = func.read("Order");
      data.forEach((e) => {
        toMessageAdmin(e);
      });
    } else if (msg.text == "Qo'shish" || msg.text == "O'zgartirish") {
      // bot.sendMessage(admin, "Mahsulot bo'limini tanlang!", {
      //   reply_markup: {
      //     keyboard: keyboards.royxat2,
      //     resize_keyboard: true,
      //   },
      // });
    } else if (msg.text == "O'chirish") {
      bot.sendMessage(chat_id, "Xaridorning telefon raqamini kiriting!");
      deleteUser = true;
    } else if (msg.from.id == admin && msg.text[0] == "+") {
      if (msg.text.length == 13) {
        let data = func.read("Order");
        if (deleteUser) {
          let users = data.filter((e) => e.contact != msg.text);
          func.write("Order", users);
          deleteUser = false;
          bot.sendMessage(admin, "✅ Xaridor o'chirildi!");
          bot.deleteMessage(admin, msg.message.message_id);
        } else {
          let user = data.find((e) => e.contact == msg.text);
          if (user) toMessageAdmin(user);
          else bot.sendMessage(admin, "Topilmadi❗️");
        }
      } else {
        bot.sendMessage(chat_id, "Xato ❌");
      }
      // } else if (
      //   msg.text == "Joynamoz+" ||
      //   msg.text == "Quron+" ||
      //   msg.text == "Nabor+" ||
      //   msg.text == "Boshqa+"
      // ) {
      //   filePath = msg.text.slice(0, msg.text.length - 1);
      //   bot.sendMessage(chat_id, "Hozircha qo'sha olmaysiz!");
      //   image = true;
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

      bot.sendPhoto(chat_id, "./images/" + filePath + "/main.jpg", {
        caption: desc,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    } else if (msg.text == "Ortga") {
      bot.sendMessage(chat_id, "Sovg'alar 🎁", {
        reply_markup: {
          keyboard: [keyboards.menu],
          resize_keyboard: true,
        },
      });
      chat = 0;
    }
  } catch (e) {
    console.log(e);
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
      bot.sendMessage(chat_id, "Yaxshi\nYana tanlang!", {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text:
                  "🛒 dagi   " +
                  productlar.length +
                  " ta  🛍ni  adminga jo'natish",
                callback_data: "NewOrder",
              },
            ],
          ],
          resize_keyboard: true,
        },
      });

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
            date: Date(new Date()).split(" ").splice(1, 3).join("-"),
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
          func.write("Order", data);
          bot.deleteMessage(chat_id, msg.message.message_id);
          bot.sendMessage(chat_id, "✅ Siz bilan Admin bog'lanadi!", {
            reply_markup: {
              keyboard: [[{ text: "RO'YXAT 📋" }]],
              resize_keyboard: true,
            },
          });
          toMessageAdmin(obj);
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
          date: Date(new Date()).split(" ").splice(1, 3).join("-"),
          products: productlar,
        };
        obj.products.map((el, i) =>
          el.product_id ? el : (el.product_id = i + 1)
        );
        data.push(obj);
        func.write("Order", data);
        console.log(msg.message.message_id);
        toMessageAdmin(obj);
        await bot.sendMessage(chat_id, "✅ Siz bilan Admin bog'lanadi!", {
          reply_markup: {
            keyboard: [[{ text: "RO'YXAT 📋" }]],
            resize_keyboard: true,
          },
        });
      }
      con = 0;
    } else if (msg.data[0] == "X") {
      bot.deleteMessage(chat_id, msg.message.message_id);
    } else if (parseInt(msg.data)) {
      try {
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
      func.write("Order", orders);
      toMessageAdmin(orders[find]);
      bot.deleteMessage(chat_id, msg.message.message_id);

      bot.sendMessage(chat_id, "✅ " + id + "-o'chirildi", {
        reply_markup: {
          keyboard: [keyboards.menu],
          resize_keyboard: true,
        },
      });
    } else if (msg.data == "Ortga") {
      con = 0;
    }
  } catch (err) {
    console.log(err);
  }
});

bot.on("contact", (msg) => {
  const chat_id = msg.from.id;
  contact = "+" + msg.contact.phone_number;
  if (productlar.length) {
    chat += 1;
    bot.sendMessage(chat_id, "Joylashuvni jo'nating", {
      reply_markup: {
        keyboard: keyboards.location,
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  } else {
    bot.sendMessage(chat_id, "Avval mahsulot tanlang!");
  }
});

bot.on("location", async (msg) => {
  const chat_id = msg.from.id;
  if (productlar.length) {
    chat += 1;
    const { latitude, longitude } = msg.location;
    let locatsiya = await geoFinder(latitude, longitude);
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
  } else {
    bot.sendMessage(chat_id, "Avval mahsulot tanlang!");
  }
});
