let UserInfo = require("../../../../Models/UserInfo")
let xsmb_cuoc = require("../../../../Models/XoSo/mb/xsmb_cuoc")

let numberPad = require("../../../../Helpers/Helpers").numberPad

module.exports = function (client, data) {
  if (!!data.so && typeof data.so === "string" && !!data.diem) {
    let diem = data.diem >> 0
    if (diem > 0 && diem < 1000000) {
      let banDate = new Date()
      banDate.setHours(18, 0, 0, 0)
      let timeCL = banDate - new Date()
      if (timeCL > 0) {
        // Tách số
        let res = data.so.split(",")
        res = res.map(function (obj) {
          obj = obj.trim()
          if (obj.length === 2) {
            return obj
          }
          return void 0
        })
        res = res.filter(function (obj) {
          return obj !== void 0
        })
        if (res.length !== 10) {
          client.red({ XoSo: { notice: "1 ตั๋วเดิมพันต้องใช้ 10 หมายเลข..." } })
        } else {
          let tongTien = res.length * diem * 1000
          UserInfo.findOne({ id: client.UID }, "red", function (err, users) {
            if (!!users && users.red >= tongTien) {
              users.red -= tongTien
              users.save()

              let date = new Date()
              let stringTime =
                numberPad(date.getDate(), 2) +
                "/" +
                numberPad(date.getMonth() + 1, 2) +
                "/" +
                date.getFullYear()

              xsmb_cuoc.create({
                name: client.profile.name,
                date: stringTime,
                type: "truot10",
                so: res,
                diem: diem,
                cuoc: tongTien,
                time: new Date(),
              })
              client.red({
                notice: {
                  text: "เดิมพันที่ประสบความสำเร็จ...",
                  title: "ประสบความสำเร็จ",
                },
                user: { red: users.red - tongTien },
              })
              date = null
              stringTime = null
              users = null
              tongTien = null
              diem = null
            } else {
              client.red({ XoSo: { notice: "ยอดคงเหลือไม่พร้อมใช้งาน..." } })
            }
            res = null
            client = null
          })
        }
      } else {
        client.red({
          XoSo: { notice: "หมดเวลาเลือกเลขแล้ว พรุ่งนี้มาใหม่..." },
        })
      }
    } else {
      client.red({ XoSo: { notice: "จำนวนคะแนนสูงสุดคือ 1,000,000" } })
    }
  } else {
    client.red({ XoSo: { notice: "ข้อมูลไม่ถูกต้อง..." } })
  }
}
