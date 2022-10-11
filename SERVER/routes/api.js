let tab_NapThe = require("../app/Models/NapThe")
let MenhGia = require("../app/Models/MenhGia")
let UserInfo = require("../app/Models/UserInfo")
let config = require("../config/thecao")
let Bank_history = require("../app/Models/Bank/Bank_history")
let Helper = require("../app/Helpers/Helpers")
//let crypto       = require('crypto');

module.exports = function (app, redT) {
  // Sign API

  app.get("/api/callback/prepaid_card", function (req, res) {
    return res.render("callback/prepaid_card")
  })
  app.post("/api/callback/prepaid_card", function (req, res) {
    try {
      let data = req.body
      if (!!data && !!data.status && !!data.request_id) {
        if (data.status == "1") {
          // ประสบความสำเร็จ
          tab_NapThe.findOneAndUpdate(
            { _id: data.request_id },
            { $set: { status: 1 } },
            function (err, napthe) {
              if (!!napthe && napthe.nhan == 0) {
                MenhGia.findOne(
                  { name: napthe.menhGia, nap: true },
                  {},
                  function (errMG, dataMG) {
                    if (!!dataMG) {
                      let nhan = dataMG.values
                      UserInfo.findOneAndUpdate(
                        { id: napthe.uid },
                        { $inc: { red: nhan } },
                        function (err2, user) {
                          if (!!user && void 0 !== redT.users[napthe.uid]) {
                            redT.users[napthe.uid].forEach(function (obj) {
                              obj.red({
                                notice: {
                                  title: "ประสบความสำเร็จ",
                                  text:
                                    "โหลดบัตรขูดพร้อมค่าเงินสำเร็จแล้ว " +
                                    Helper.numberWithCommas(dataMG.values),
                                  load: false,
                                },
                                user: { red: user.red * 1 + nhan },
                              })
                            })
                          }
                        }
                      )
                      tab_NapThe
                        .updateOne(
                          { _id: data.request_id },
                          { $set: { nhan: nhan } }
                        )
                        .exec()
                    }
                  }
                )
              }
            }
          )
        } else {
          // ความล้มเหลว
          tab_NapThe.findOneAndUpdate(
            { _id: data.request_id },
            { $set: { status: 2 } },
            function (err, napthe) {
              if (!!napthe) {
                if (void 0 !== redT.users[napthe.uid]) {
                  redT.users[napthe.uid].forEach(function (obj) {
                    obj.red({
                      notice: {
                        title: "ความล้มเหลว",
                        text: config[data.status],
                        load: false,
                      },
                    })
                  })
                }
              }
            }
          )
        }
      }
    } catch (errX) {
      //
    }
    return res.render("callback/prepaid_card")
  })

  app.get("/api/callback/bank", function (req, res) {
    return res.render("callback/bank")
  })
  app.post("/api/callback/bank", function (req, res) {
    try {
      let data = req.body
      // var hash = crypto.createHmac('SHA256', secret).update(string).digest('ascii');
      if (!!data && !!data.order) {
        let sign = data.sign
        let mrc_id = data.order.mrc_order_id
        let stat = data.order.stat
        if (!!sign && !!mrc_id && !!stat) {
          Bank_history.findOne(
            { _id: mrc_id },
            "uid money status",
            function (err, history) {
              if (!!history) {
                if (stat === "c") {
                  if (history.status !== 1) {
                    history.status = 1
                    history.save()
                    UserInfo.findOneAndUpdate(
                      { id: history.uid },
                      { $inc: { red: history.money } },
                      function (err2, user) {
                        if (!!user && void 0 !== redT.users[history.uid]) {
                          redT.users[history.uid].forEach(function (obj) {
                            obj.red({
                              offurl: true,
                              notice: {
                                title: "ประสบความสำเร็จ",
                                text:
                                  "เติมเงินสำเร็จ " +
                                  Helper.numberWithCommas(history.money),
                                load: false,
                              },
                              user: { red: user.red * 1 + history.money * 1 },
                            })
                          })
                        }
                      }
                    )
                  }
                } else if (stat === "p" || stat === "r") {
                  if (void 0 !== redT.users[history.uid]) {
                    redT.users[history.uid].forEach(function (obj) {
                      obj.red({
                        offurl: true,
                        notice: {
                          title: "รอดำเนินการ",
                          text: "คำขอฝากเงินของคุณอยู่ระหว่างดำเนินการ...",
                          load: false,
                        },
                      })
                    })
                  }
                } else {
                  history.status = 2
                  history.save()
                  if (void 0 !== redT.users[history.uid]) {
                    redT.users[history.uid].forEach(function (obj) {
                      obj.red({
                        offurl: true,
                        notice: {
                          title: "คำเตือน",
                          text: "เติมเงินไม่สำเร็จ. สแปมจะถูกล็อคอย่างถาวร.",
                          load: false,
                        },
                      })
                    })
                  }
                }
              }
            }
          )
        }
      }
    } catch (errX) {
      //console.log(errX);
    }
    return res.render("callback/bank")
  })
}
