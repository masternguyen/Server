let UserInfo = require("../Models/UserInfo")
let Phone = require("../Models/Phone")
let GiftCode = require("../Models/GiftCode")
let validator = require("validator")
let Helpers = require("../Helpers/Helpers")

module.exports = function (client, data) {
  if (!!data.captcha && !!data.code) {
    let code = "" + data.code + ""
    if (!validator.isLength(data.captcha, { min: 4, max: 4 })) {
      client.red({
        notice: { title: "ข้อผิดพลาด", text: "Captcha ไม่ถูกต้อง..." },
      })
    } else if (!validator.isLength(code, { min: 9, max: 16 })) {
      client.red({
        notice: { title: "ข้อผิดพลาด", text: "GiftCode ไม่ได้อยู่ !!" },
      })
    } else {
      let checkCaptcha = new RegExp("^" + data.captcha + "$", "i").test(
        client.captcha
      )
      if (checkCaptcha) {
        //code = code.toLowerCase();
        UserInfo.findOne(
          { id: client.UID },
          "gitCode gitTime",
          function (errCheckG, CheckG) {
            if (!!CheckG) {
              Phone.findOne(
                { uid: client.UID },
                "gitCode",
                function (errPhone, dPhone) {
                  let quyen = false
                  if (
                    CheckG.gitCode === void 0 ||
                    CheckG.gitCode === 0 ||
                    !!dPhone
                  ) {
                    quyen = true
                  }
                  if (quyen) {
                    let timeQuyen = false
                    if (CheckG.gitTime === void 0) {
                      timeQuyen = true
                    } else {
                      let dateT = new Date()
                      dateT.setHours(0, 0, 0, 0)
                      let dateH = CheckG.gitTime
                      dateH.setHours(0, 0, 0, 0)
                      if (dateT - dateH > 86400000) {
                        timeQuyen = true
                      }
                    }
                    if (timeQuyen) {
                      GiftCode.findOne(
                        { code: code },
                        {},
                        function (err, check) {
                          if (!!check) {
                            let d1 = Date.parse(new Date())
                            let d2 = Date.parse(check.todate)
                            if (d2 > d1) {
                              if (void 0 !== check.uid) {
                                client.red({
                                  notice: {
                                    title: "ความล้มเหลว",
                                    text:
                                      "รหัสของขวัญที่ใช้แล้ว." +
                                      "\n" +
                                      " ลองรหัสอื่น...",
                                  },
                                })
                              } else {
                                if (validator.isEmpty(check.type)) {
                                  check.uid = client.UID
                                  check.save()
                                  UserInfo.findOneAndUpdate(
                                    { id: client.UID },
                                    {
                                      $set: { gitTime: new Date() },
                                      $inc: {
                                        red: check.red,
                                        xu: check.xu,
                                        gitCode: 1,
                                        gitRed: check.red,
                                      },
                                    }
                                  ).exec(function (err, user) {
                                    client.red({
                                      notice: {
                                        title: "ประสบความสำเร็จ",
                                        text:
                                          "คุณได้รับ: " +
                                          (check.red > 0
                                            ? Helpers.numberWithCommas(
                                                check.red
                                              ) + " R"
                                            : "") +
                                          (check.xu > 0
                                            ? (check.red > 0 ? " และ " : "") +
                                              Helpers.numberWithCommas(
                                                check.xu
                                              ) +
                                              " เหรียญ"
                                            : ""),
                                      },
                                      user: {
                                        red: user.red * 1 + check.red,
                                        xu: user.xu * 1 + check.xu,
                                      },
                                    })
                                  })
                                } else {
                                  GiftCode.findOne(
                                    { uid: client.UID, type: check.type },
                                    "code",
                                    function (err, check2) {
                                      if (!!check2) {
                                        client.red({
                                          notice: {
                                            title: "ความล้มเหลว",
                                            text: "คุณเคยใช้รหัสของขวัญนี้มาก่อนหรือไม่...!!",
                                          },
                                        })
                                      } else {
                                        check.uid = client.UID
                                        check.save()
                                        UserInfo.findOneAndUpdate(
                                          { id: client.UID },
                                          {
                                            $set: { gitTime: new Date() },
                                            $inc: {
                                              red: check.red,
                                              xu: check.xu,
                                              gitCode: 1,
                                              gitRed: check.red,
                                            },
                                          }
                                        ).exec(function (err, user) {
                                          client.red({
                                            notice: {
                                              title: "ประสบความสำเร็จ",
                                              text:
                                                "คุณได้รับ: " +
                                                (check.red > 0
                                                  ? Helpers.numberWithCommas(
                                                      check.red
                                                    ) + " RED"
                                                  : "") +
                                                (check.xu > 0
                                                  ? (check.red > 0
                                                      ? " และ "
                                                      : "") +
                                                    Helpers.numberWithCommas(
                                                      check.xu
                                                    ) +
                                                    " เหรียญ"
                                                  : ""),
                                            },
                                            user: {
                                              red: user.red * 1 + check.red,
                                              xu: user.xu * 1 + check.xu,
                                            },
                                          })
                                        })
                                      }
                                    }
                                  )
                                }
                              }
                            } else {
                              client.red({
                                notice: {
                                  title: "ความล้มเหลว",
                                  text: "รหัสของขวัญหมดอายุ...!!",
                                },
                              })
                            }
                          } else {
                            client.red({
                              notice: {
                                title: "ความล้มเหลว",
                                text: "ไม่มีรหัสของขวัญ...!!",
                              },
                            })
                          }
                        }
                      )
                    } else {
                      client.red({
                        notice: {
                          title: "การแจ้งเตือน",
                          text:
                            "คุณได้รับรหัสของขวัญวันนี้." +
                            "\n" +
                            " กลับมาพรุ่งนี้.",
                        },
                      })
                    }
                  } else {
                    client.red({
                      notice: {
                        title: "ความล้มเหลว",
                        text: "รหัสของขวัญมีไว้สำหรับบัญชีที่เปิดใช้งานเท่านั้น...!!",
                        button: { text: "เปิดใช้งาน", type: "reg_otp" },
                      },
                    })
                  }
                }
              )
            }
          }
        )
      } else {
        client.red({
          notice: { title: "ความล้มเหลว", text: "Captcha ไม่ถูกต้อง." },
        })
      }
    }
  }
  client.c_captcha("giftcode")
}
