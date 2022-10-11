let shortid = require("shortid")
let telegram = require("../../Models/Telegram")
let Phone = require("../../Models/Phone")
let GiftCode = require("../../Models/GiftCode")

module.exports = function (bot, id) {
  telegram.findOne({ form: id }, {}, function (err1, check) {
    if (check) {
      if (!check.gift) {
        Phone.findOne({ phone: check.phone }, {}, function (err2, checkPhone) {
          if (checkPhone) {
            // Gift khởi nghiệp
            let get_gift = shortid.generate()
            try {
              GiftCode.create(
                {
                  code: get_gift,
                  red: 10000,
                  date: new Date(),
                  todate: new Date(new Date() * 1 + 86400000),
                  to: checkPhone.uid,
                },
                function (err3, gift) {
                  if (!!gift) {
                    check.gift = true
                    check.save()
                    bot.sendMessage(
                      id,
                      "ขอแสดงความยินดีที่ได้รับ Start-up Giftcode, Giftcode ของคุณคือ: " +
                        get_gift,
                      { reply_markup: { remove_keyboard: true } }
                    )
                    check = null
                    bot = null
                    id = null
                  }
                }
              )
            } catch (e) {
              check = null
              bot = null
              id = null
            }
          } else {
            check = null
            bot.sendMessage(
              id,
              "_การทำงานล้มเหลว, ไม่สามารถอ่านหมายเลขโทรศัพท์ได้_",
              {
                parse_mode: "markdown",
                reply_markup: { remove_keyboard: true },
              }
            )
            bot = null
            id = null
          }
        })
      } else {
        check = null
        bot.sendMessage(id, "_คุณได้รับรหัสของขวัญเริ่มต้น_", {
          parse_mode: "markdown",
          reply_markup: { remove_keyboard: true },
        })
        bot = null
        id = null
      }
    } else {
      check = null
      bot.sendMessage(
        id,
        "_การทำงานล้มเหลว, ไม่สามารถอ่านหมายเลขโทรศัพท์ได้_",
        { parse_mode: "markdown", reply_markup: { remove_keyboard: true } }
      )
      bot = null
      id = null
    }
  })
}
