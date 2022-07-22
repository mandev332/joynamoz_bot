import { config } from "dotenv";
config();
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import TelegramBot from "node-telegram-bot-api";

const bot = new TelegramBot(process.env.API_KEY, {
  polling: true,
});

bot.on("error", console.error);

let Adress = "";
let contact = "";
let filePath = "";
let productlar = [];
let message_id;
let con = 0;

function read(adress) {
  let datas = fs.readFileSync(
    path.join(process.cwd(), "database", (adress || "Joynamoz") + ".json"),
    "utf-8"
  );
  return JSON.parse(datas);
}

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.from.id,
    "Assalomu alaykum! " + "\n" + msg.from.first_name,
    {
      reply_markup: {
        keyboard: [
          [
            {
              text: "MENU 📋",
            },
          ],
        ],
        resize_keyboard: true,
      },
    }
  );
});

bot.on("message", (msg) => {
  const chat_id = msg.from.id;

  if (msg.text == "MENU 📋") {
    bot.sendMessage(chat_id, "Svg'alar 🎁", {
      reply_markup: {
        keyboard: [
          [
            {
              text: "Joynamoz",
            },
            {
              text: "Quron",
            },
          ],
          [
            {
              text: "Nabor",
            },
            {
              text: "Boshqa",
            },
          ],
        ],
        resize_keyboard: true,
      },
    });
  } else if (
    msg.text == "Joynamoz" ||
    msg.text == "Quron" ||
    msg.text == "Nabor" ||
    msg.text == "Boshqa"
  ) {
    filePath = msg.text;
    let datas = read(msg.text);
    let orders = read("Order");
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
    if (findUser) {
      buttons.push([{ text: "Buyutmalarim 🛍", callback_data: "Order" }]);
    }

    bot.sendPhoto(chat_id, "./images/" + filePath + "/main.jpg", {
      caption: desc,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }
});

bot.on("callback_query", async (msg) => {
  try {
    console.log(msg);
    const chat_id = msg.message?.chat.id;
    if (msg.data[0] == "Z") {
      let datas = read(filePath);
      let product = datas.find((pro) => pro.id == msg.data.slice(2));
      if (product) productlar.push(product);
      bot.sendMessage(chat_id, "Kontaktingizni yuboring!", {
        reply_markup: {
          keyboard: [
            [
              {
                text: "Kontakt",
                request_contact: true,
              },
            ],
            ["Cancel"],
          ],
          resize_keyboard: true,
        },
      });
    } else if (msg.data == "loc_ok" && con) {
      let data = read("Order");
      if (!msg.from.is_bot) {
        let users = data.find((u) => u.user_id == msg.from.id) || [];
        let obj = {
          user_id: msg.from.id,
          username: msg.from.first_name,
          nik_name: msg.from.username,
          contact,
          adress: Adress,
          products: users?.products?.length
            ? [...users.products, ...productlar]
            : [...productlar],
        };
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
      }
      bot.sendSticker(chat_id, "✔️");
      // bot.deleteMessage(chat_id, msg.message.message_id);
      con = 0;
    } else if (msg.data[0] == "X") {
      bot.deleteMessage(chat_id, msg.message.message_id);
    } else if (parseInt(msg.data)) {
      // if (message_id) bot.deleteMessage(chat_id, msg.message.message_id);
      message_id = msg.message.message_id;
      console.log(msg.message.message_id);
      let data = read(filePath);
      let find = data.find((e) => e.id == msg.data);
      let desc = `Nomi: ${find.name}\nNarxi: ${find.price} ming \nEski narxi: <del>${find.sold}</del> ming\nQo'shimcha ma'lumot: ${find.title}\n`;

      find.size && find.size instanceof Array
        ? (desc += `O'lchami: ${find.size[0]} x ${find.size[1]}`)
        : (desc += ` `);

      bot.sendPhoto(chat_id, "./images/" + filePath + "/" + msg.data + ".jpg", {
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
      });
    } else if (msg.data == "Order") {
      let datas = read(msg.data);
      let desc = ``;
      let button = [];
      let buttons = [];
      let user = datas.find((u) => u.user_id == msg.from.id);
      if (user) {
        for (let data of user.products) {
          let { id, name, title } = data;
          desc +=
            id +
            ":    <strong>" +
            name +
            "</strong>   <i>(" +
            title +
            ")</i> \n";
          button.push({ text: id + " ❌", callback_data: "order_" + id });
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
    }
  } catch (err) {
    console.log(err);
  }
});

bot.on("contact", (msg) => {
  const chat_id = msg.from.id;
  contact = msg.contact.phone_number;
  bot.sendMessage(chat_id, "Locatsiyani jo'nating", {
    reply_markup: {
      keyboard: [
        [
          {
            text: "Location 📍",
            request_location: true,
          },
        ],
      ],
      resize_keyboard: true,
    },
  });
});

bot.on("location", async (msg) => {
  const chat_id = msg.from.id;
  const { latitude, longitude } = msg.location;
  let locatsiya = await fetch(
    `https://api.opencagedata.com/geocode/v1/json?key=${process.env.GEO_API_KEY}&q=${latitude}%2C+${longitude}&pretty=1&no_annotations=1`
  );

  locatsiya = await locatsiya.json();
  Adress = locatsiya.results[0].formatted;
  bot.sendMessage(
    chat_id,
    "Manzilingiz: " + locatsiya.results[0].formatted + " ni tasdiqlang!",
    {
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
      },
    }
  );
  con = 1;
});
