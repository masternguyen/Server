var MuaThe = require("../../Models/MuaThe")
var MuaThe_thenap = require("../../Models/MuaThe_card")
var UserInfo = require("../../Models/UserInfo")

var NhaMang = require("../../Models/NhaMang")
var MenhGia = require("../../Models/MenhGia")

var OTP = require("../../Models/OTP")
var Phone = require("../../Models/Phone")

var validator = require("validator")
var helper = require("../../Helpers/Helpers")

module.exports = function (client, data) {
  if (
    !!data &&
    !!data.nhamang &&
    !!data.menhgia &&
    !!data.soluong &&
    !!data.otp
  ) {
    var nhaMang = data.nhamang
    var menhGia = data.menhgia
    var soluong = data.soluong >> 0
    var otp = data.otp

    if (
      validator.isEmpty(nhaMang) ||
      validator.isEmpty(menhGia) ||
      !validator.isLength(otp, { min: 4, max: 6 }) ||
      soluong < 1 ||
      soluong > 3
    ) {
      client.red({
        notice: { title: "ข้อผิดพลาด", text: "กรุณาตรวจสอบข้อมูลอีกครั้ง.!" },
      })
    } else {
      Phone.findOne({ uid: client.UID }, {}, function (err, checkPhone) {
        if (checkPhone) {
          OTP.findOne(
            { uid: client.UID, phone: checkPhone.phone },
            {},
            { sort: { _id: -1 } },
            function (err, data_otp) {
              if (data_otp && otp == data_otp.code) {
                if (
                  (new Date() - Date.parse(data_otp.date)) / 1000 > 180 ||
                  data_otp.active
                ) {
                  client.red({
                    notice: { title: "ข้อผิดพลาด", text: "OTP หมดอายุแล้ว.!" },
                  })
                } else {
                  var check1 = NhaMang.findOne({
                    name: nhaMang,
                    mua: true,
                  }).exec()
                  var check2 = MenhGia.findOne({
                    name: menhGia,
                    mua: true,
                  }).exec()

                  Promise.all([check1, check2]).then((values) => {
                    if (
                      !!values[0] &&
                      !!values[1] &&
                      soluong > 0 &&
                      soluong < 4
                    ) {
                      var totall = values[1].values * soluong
                      UserInfo.findOne(
                        { id: client.UID },
                        "red name veryphone",
                        function (err, check) {
                          if (check == null || check.red <= totall) {
                            client.red({
                              notice: {
                                title: "ซื้อทดลอง",
                                text: "ยอดคงเหลือไม่พร้อมใช้งาน.!!",
                              },
                            })
                          } else {
                            if (!check.veryphone) {
                              client.red({
                                notice: {
                                  title: "การแจ้งเตือน",
                                  text: "ฟังก์ชันสำหรับบัญชีที่ยืนยันเท่านั้น.",
                                  button: {
                                    text: "ความแม่นยำ",
                                    type: "reg_otp",
                                  },
                                },
                              })
                            } else {
                              check.red -= totall
                              check.save()
                              OTP.updateOne(
                                { _id: data_otp._id.toString() },
                                { $set: { active: true } }
                              ).exec()
                              client.red({
                                notice: {
                                  title: "ซื้อทดลอง",
                                  text: "คำขอซื้อบัตรสำเร็จ.!!",
                                },
                                user: { red: check.red },
                              })
                              MuaThe.create(
                                {
                                  uid: client.UID,
                                  nhaMang: nhaMang,
                                  menhGia: menhGia,
                                  soLuong: soluong,
                                  Cost: totall,
                                  time: new Date(),
                                },
                                function (err, dataW) {
                                  if (!!dataW) {
                                    var cID = dataW._id.toString()
                                    while (soluong > 0) {
                                      MuaThe_thenap.create({
                                        cart: cID,
                                        nhaMang: nhaMang,
                                        menhGia: menhGia,
                                      })
                                      soluong--
                                    }
                                  }
                                }
                              )
                            }
                          }
                        }
                      )
                    } else {
                      client.red({
                        notice: {
                          title: "ซื้อทดลอง",
                          text: "ข้อมูลไม่ถูกต้อง.!!",
                        },
                      })
                    }
                  })
                }
              } else {
                client.red({
                  notice: {
                    title: "ข้อผิดพลาด",
                    text: "รหัส OTP ไม่ถูกต้อง.!",
                  },
                })
              }
            }
          )
        } else {
          client.red({
            notice: {
              title: "การแจ้งเตือน",
              text: "ฟังก์ชันสำหรับบัญชีที่ยืนยันเท่านั้น.",
              button: { text: "ความแม่นยำ", type: "reg_otp" },
            },
          })
        }
      })
    }
  }
}
