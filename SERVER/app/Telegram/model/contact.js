let telegram = require("../../Models/Telegram")
let Phone = require("../../Models/Phone")
let UserInfo = require("../../Models/UserInfo")
let helpers = require("../../Helpers/Helpers")

module.exports = function (redT, id, contact) {
  let phoneCrack = helpers.phoneCrack(contact)
  if (phoneCrack) {
    Phone.findOne(
      { phone: phoneCrack.phone },
      "uid region phone",
      function (err, check1) {
        if (check1) {
          try {
            telegram.create(
              { form: id, phone: phoneCrack.phone },
              function (err, cP) {
                phoneCrack = null
                if (!!cP) {
                  UserInfo.findOneAndUpdate(
                    { id: check1.uid },
                    {
                      $set: { veryphone: true, veryold: true },
                      $inc: { red: 10000 },
                    }
                  ).exec(function (err, info) {
                    if (!!info) {
                      redT.telegram.sendMessage(
                        id,
                        "_รับรองความถูกต้องสำเร็จ_\nคุณได้รับ +10.000 R เข้าบัญชี *" +
                          info.name +
                          "*, ขอให้คุณมีความสุขในการเล่นเกม...\n\n*แนะนำ*\n\nนำเข้า:\n*OTP*:           รับรหัส OTP ฟรี.\n*GiftCode*:  รับ GiftCode เริ่มต้นตอนนี้.",
                        {
                          parse_mode: "markdown",
                          reply_markup: { remove_keyboard: true },
                        }
                      )
                      if (void 0 !== redT.users[check1.uid]) {
                        redT.users[check1.uid].forEach(function (client) {
                          client.red({
                            notice: {
                              title: "ประสบความสำเร็จ",
                              text: "รับรองความถูกต้องสำเร็จ.!\nคุณได้รับ +10,000 R ในบัญชีของคุณ\nขอให้สนุกกับเกม...",
                            },
                            user: {
                              red: info.red * 1 + 10000,
                              phone: helpers.cutPhone(
                                check1.region + check1.phone
                              ),
                              veryphone: true,
                            },
                          })
                        })
                      }
                      redT = null
                      id = null
                    }
                  })
                } else {
                  redT.telegram.sendMessage(id, "_การดำเนินการล้มเหลว_", {
                    parse_mode: "markdown",
                    reply_markup: { remove_keyboard: true },
                  })
                  redT = null
                  id = null
                }
              }
            )
          } catch (error) {
            redT.telegram.sendMessage(id, "_การดำเนินการล้มเหลว_", {
              parse_mode: "markdown",
              reply_markup: { remove_keyboard: true },
            })
            redT = null
            id = null
            phoneCrack = null
          }
        } else {
          redT.telegram.sendMessage(
            id,
            "หมายเลขโทรศัพท์นี้ไม่ได้ลงทะเบียน กรุณาลงทะเบียนที่ _JJbetwin.Com_",
            { parse_mode: "markdown", reply_markup: { remove_keyboard: true } }
          )
          redT = null
          phoneCrack = null
          id = null
        }
      }
    )
  }
}
